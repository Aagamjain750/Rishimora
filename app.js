(() => {
  const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';
  const toast = document.getElementById('toast');
  let toastTimer;
  const notify = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
  };
  const bagDrawer = document.getElementById('bag-drawer');
  const bagDrawerBackdrop = document.getElementById('bag-drawer-backdrop');
  const bagDrawerClose = document.getElementById('bag-drawer-close');
  const bagDrawerItems = document.getElementById('bag-drawer-items');
  const bagDrawerEmpty = document.getElementById('bag-drawer-empty');
  const bagDrawerMessage = document.getElementById('bag-drawer-message');
  const bagDrawerCount = document.getElementById('bag-drawer-count');
  const bagDrawerSubtotal = document.getElementById('bag-drawer-subtotal');
  let bagDrawerPreviousFocus = null;
  const renderBagDrawer = (cart, message) => {
    if (!bagDrawerItems || !cart) return;
    bagDrawerItems.replaceChildren();
    cart.items.forEach(item => {
      const row = document.createElement('li');
      row.className = 'bag-drawer-item';
      const itemName = String(item.name || 'Product');
      const mark = document.createElement('span');
      mark.className = 'bag-drawer-mark';
      mark.textContent = itemName.trim().charAt(0).toUpperCase();
      const details = document.createElement('div');
      details.className = 'bag-drawer-item-copy';
      const name = document.createElement('strong');
      name.textContent = itemName;
      const description = document.createElement('span');
      description.textContent = item.description || 'Made with comfort and care.';
      const quantity = document.createElement('span');
      quantity.textContent = `Qty ${item.quantity} · ${item.price_formatted} each`;
      details.append(name, description, quantity);
      const price = document.createElement('strong');
      price.className = 'bag-drawer-line-total';
      price.textContent = item.line_total_formatted;
      row.append(mark, details, price);
      bagDrawerItems.append(row);
    });
    bagDrawerItems.hidden = cart.items.length === 0;
    bagDrawerEmpty.hidden = cart.items.length !== 0;
    bagDrawerCount.textContent = `(${cart.item_count} items)`;
    bagDrawerSubtotal.textContent = cart.subtotal_formatted;
    bagDrawerMessage.textContent = message;
  };
  const closeBagDrawer = () => {
    if (!bagDrawer || bagDrawer.getAttribute('aria-hidden') === 'true') return;
    bagDrawer.classList.remove('is-open');
    bagDrawerBackdrop.classList.remove('is-open');
    bagDrawer.setAttribute('aria-hidden', 'true');
    bagDrawer.setAttribute('inert', '');
    document.body.classList.remove('bag-drawer-lock');
    window.setTimeout(() => {
      if (!bagDrawer.classList.contains('is-open')) bagDrawerBackdrop.hidden = true;
    }, 280);
    bagDrawerPreviousFocus?.focus();
  };
  const openBagDrawer = (cart, message) => {
    if (!bagDrawer || !bagDrawerBackdrop) return;
    if (!cart || !Array.isArray(cart.items)) {
      notify('Item added, but the bag preview could not load. Open Bag to view it.');
      return;
    }
    renderBagDrawer(cart, message);
    bagDrawerPreviousFocus = document.activeElement;
    bagDrawerBackdrop.hidden = false;
    requestAnimationFrame(() => {
      bagDrawerBackdrop.classList.add('is-open');
      bagDrawer.classList.add('is-open');
    });
    bagDrawer.removeAttribute('inert');
    bagDrawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('bag-drawer-lock');
    bagDrawerClose.focus();
  };
  bagDrawerClose?.addEventListener('click', closeBagDrawer);
  bagDrawerBackdrop?.addEventListener('click', closeBagDrawer);
  bagDrawer?.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...bagDrawer.querySelectorAll('a[href], button:not([disabled])')]
      .filter(element => !element.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  const checkoutRadios = [...document.querySelectorAll('input[name="payment_method"]')];
  if (checkoutRadios.length) {
    const syncCheckoutInstrument = () => {
      const method = checkoutRadios.find(radio => radio.checked)?.value;
      [['card', 'card-instrument', 'card_id'], ['upi', 'upi-instrument', 'upi_id']].forEach(([type, containerId, selectName]) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        const active = method === type;
        container.hidden = !active;
        const select = container.querySelector(`select[name="${selectName}"]`);
        if (select) select.required = active;
      });
    };
    checkoutRadios.forEach(radio => radio.addEventListener('change', syncCheckoutInstrument));
    syncCheckoutInstrument();
  }
  document.querySelectorAll('[data-loading-form]').forEach(form => {
    let busy = false;
    form.addEventListener('submit', event => {
      if (busy) { event.preventDefault(); return; }
      busy = true;
      const button = form.querySelector('button[type="submit"]');
      if (!button) return;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.classList.add('is-busy');
      button.querySelector('.button-label').textContent = form.dataset.loadingLabel || 'Working...';
    });
  });

  const search = document.getElementById('product-search');
  if (search) {
    const cards = [...document.querySelectorAll('[data-product-card]')];
    const banner = document.getElementById('shop-banner');
    const clear = document.getElementById('clear-search');
    const noResults = document.getElementById('search-empty');
    let searchSaveTimer;
    const runSearch = (persist = true) => {
      const term = search.value.trim().toLowerCase();
      if (banner) banner.hidden = Boolean(term);
      let visible = 0;
      cards.forEach(card => {
        const match = !term || `${card.dataset.name} ${card.dataset.description}`.includes(term);
        card.hidden = !match;
        if (match) visible++;
      });
      clear.hidden = !term;
      noResults.hidden = visible > 0 || cards.length === 0;
      if (persist) {
        clearTimeout(searchSaveTimer);
        searchSaveTimer = setTimeout(async () => {
          try {
            const response = await fetch('/search', { method: 'POST', headers: {'Content-Type':'application/json','X-CSRF-Token':csrf}, body: JSON.stringify({query: term}) });
            if (!response.ok && response.status !== 503) notify('Search could not be saved.');
          } catch (_) { /* Client-side filtering remains available offline. */ }
        }, 650);
      }
    };
    search.addEventListener('input', runSearch);
    clear.addEventListener('click', () => { search.value = ''; runSearch(); search.focus(); });
    document.getElementById('empty-reset')?.addEventListener('click', () => { search.value = ''; runSearch(); search.focus(); });
    if (search.value) runSearch(false);
  }

  const navBurger = document.getElementById('nav-burger');
  const mobileNav = document.getElementById('nav-mobile-menu');
  const closeMobileNav = () => {
    if (!navBurger || !mobileNav) return;
    mobileNav.classList.remove('is-open');
    navBurger.setAttribute('aria-expanded', 'false');
    navBurger.setAttribute('aria-label', 'Open navigation menu');
  };
  navBurger?.addEventListener('click', () => {
    const open = navBurger.getAttribute('aria-expanded') !== 'true';
    navBurger.setAttribute('aria-expanded', String(open));
    navBurger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    mobileNav?.classList.toggle('is-open', open);
  });
  mobileNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileNav));
  document.addEventListener('click', event => {
    if (mobileNav && !mobileNav.contains(event.target) && !navBurger?.contains(event.target)) closeMobileNav();
  });

  const profileArea = document.getElementById('profile-area');
  const profileTrigger = document.getElementById('profile-trigger');
  const profileMenu = document.getElementById('profile-menu');
  let profileCloseTimer;
  const closeProfile = () => { if (!profileMenu) return; profileMenu.hidden = true; profileTrigger.setAttribute('aria-expanded', 'false'); };
  const openProfile = () => { clearTimeout(profileCloseTimer); if (!profileMenu) return; profileMenu.hidden = false; profileTrigger.setAttribute('aria-expanded', 'true'); };
  const scheduleProfileClose = () => { clearTimeout(profileCloseTimer); profileCloseTimer = setTimeout(closeProfile, 1000); };
  profileArea?.addEventListener('pointerenter', openProfile);
  profileArea?.addEventListener('pointerleave', scheduleProfileClose);
  profileArea?.addEventListener('focusin', openProfile);
  profileArea?.addEventListener('focusout', event => {
    if (!profileArea.contains(event.relatedTarget)) closeProfile();
  });
  profileTrigger?.addEventListener('click', openProfile);
  const navMenuTriggers = [...document.querySelectorAll('[data-nav-menu]')];
  const closeNavMenus = () => navMenuTriggers.forEach(trigger => {
    document.getElementById(trigger.dataset.navMenu).hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  });
  const openNavMenu = menuId => {
    closeNavMenus();
    closeProfile();
    const trigger = navMenuTriggers.find(item => item.dataset.navMenu === menuId);
    const menu = document.getElementById(menuId);
    if (trigger && menu) {
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    }
  };
  navMenuTriggers.forEach(trigger => trigger.addEventListener('click', event => {
    event.stopPropagation();
    const menu = document.getElementById(trigger.dataset.navMenu);
    const shouldOpen = menu.hidden;
    closeNavMenus();
    closeProfile();
    if (shouldOpen) {
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    }
  }));
  document.querySelectorAll('.nav-popover a').forEach(link => link.addEventListener('click', closeNavMenus));
  document.addEventListener('click', event => { if (profileArea && !profileArea.contains(event.target)) closeProfile(); });
  document.addEventListener('click', event => { if (!event.target.closest('.nav-menu-anchor')) closeNavMenus(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMobileNav(); closeProfile(); closeNavMenus(); closeBagDrawer(); document.getElementById('preview-dialog')?.close(); } });
  document.querySelectorAll('[data-showpiece]:not([data-showpiece="Wishlist"])').forEach(button => button.addEventListener('click', () => { closeProfile(); notify(`${button.dataset.showpiece} will be available soon.`); }));
  document.querySelector('#profile-menu [data-showpiece="Wishlist"]')?.addEventListener('click', event => {
    event.stopPropagation();
    openNavMenu('wishlist-menu');
  });

  const updateMenuProduct = (listId, card, productId, active, quantityDelta = 0) => {
    const list = document.getElementById(listId);
    const empty = document.getElementById(listId === 'bag-items' ? 'bag-empty' : 'wishlist-empty');
    if (!list || !empty) return;
    let row = [...list.querySelectorAll('[data-menu-product-id]')].find(item => item.dataset.menuProductId === productId);
    if (listId === 'wishlist-items') {
      if (active && !row) {
        row = document.createElement('li');
        row.className = 'nav-product';
        row.dataset.menuProductId = productId;
        const link = document.createElement('a');
        link.href = `#product-${productId}`;
        const name = document.createElement('span');
        name.className = 'nav-product-name';
        name.textContent = card.dataset.title;
        const price = document.createElement('span');
        price.className = 'nav-product-price';
        price.textContent = card.dataset.price;
        link.append(name, price);
        row.append(link);
        list.append(row);
      } else if (!active && row) row.remove();
    } else if (quantityDelta > 0) {
      if (!row) {
        row = document.createElement('li');
        row.className = 'nav-product';
        row.dataset.menuProductId = productId;
        const link = document.createElement('a');
        link.href = `#product-${productId}`;
        const name = document.createElement('span');
        name.className = 'nav-product-name';
        name.textContent = card.dataset.title;
        const price = document.createElement('span');
        price.className = 'nav-product-price';
        price.textContent = card.dataset.price;
        link.append(name, price);
        const quantity = document.createElement('span');
        quantity.className = 'nav-product-quantity';
        quantity.textContent = 'Qty 0';
        row.append(link, quantity);
        list.append(row);
      }
      const quantity = row.querySelector('.nav-product-quantity');
      quantity.textContent = `Qty ${(Number(quantity.textContent.replace(/\D/g, '')) || 0) + quantityDelta}`;
    } else if (quantityDelta < 0 && row) {
      const quantity = row.querySelector('.nav-product-quantity');
      const next = (Number(quantity.textContent.replace(/\D/g, '')) || 0) + quantityDelta;
      if (next <= 0) row.remove();
      else quantity.textContent = `Qty ${next}`;
    }
    list.hidden = list.children.length === 0;
    empty.hidden = list.children.length > 0;
  };

  const setBagMenuQuantity = (productId, quantity) => {
    const list = document.getElementById('bag-items');
    const row = list && [...list.querySelectorAll('[data-menu-product-id]')]
      .find(item => item.dataset.menuProductId === productId);
    const value = row?.querySelector('.nav-product-quantity');
    if (value) value.textContent = `Qty ${quantity}`;
  };

  const setBusy = (button, active, label) => {
    button.disabled = active;
    button.setAttribute('aria-busy', String(active));
    button.classList.toggle('is-busy', active);
    const text = button.querySelector('.button-label');
    if (text) text.textContent = active ? label : 'Add to bag';
  };
  document.querySelectorAll('[data-action="cart"], [data-action="wishlist"]').forEach(button => {
    let busy = false;
    button.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      const action = button.dataset.action;
      const productId = button.dataset.productId;
      const card = button.closest('[data-product-card]');
      const countNode = document.getElementById(action === 'cart' ? 'bag-count' : 'wishlist-count');
      const oldCount = Number(countNode?.textContent) || 0;
      const oldActive = button.classList.contains('is-active');
      const delta = action === 'cart' ? 1 : (oldActive ? -1 : 1);
      if (action === 'cart') {
        setBusy(button, true, 'Adding...');
      } else {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.classList.toggle('is-active', !oldActive);
        button.setAttribute('aria-pressed', String(!oldActive));
        countNode.textContent = Math.max(0, oldCount + delta) || '';
        updateMenuProduct('wishlist-items', card, productId, !oldActive);
        notify(!oldActive ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
      }
      try {
        const endpoint = action === 'cart' ? '/cart/add' : '/wishlist/toggle';
        const response = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json','X-CSRF-Token':csrf}, body: JSON.stringify({ product_id: button.dataset.productId, quantity: 1 }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Please try again.');
        if (action === 'cart') {
          if (countNode) countNode.textContent = result.item_count;
          const message = result.product_quantity >= 10
            ? 'Maximum quantity per item is 10.'
            : `${card?.dataset.title || 'Product'} added to your bag.`;
          notify(message);
          openBagDrawer(result.cart, message);
        } else {
          button.classList.toggle('is-active', result.active);
          button.setAttribute('aria-pressed', String(result.active));
          if (countNode) countNode.textContent = result.count || '';
          updateMenuProduct('wishlist-items', card, productId, result.active);
          if (location.pathname === '/wishlist' && !result.active) {
            card.remove();
            const grid = document.getElementById('wishlist-page-grid');
            const remaining = grid.querySelectorAll('[data-product-card]').length;
            grid.hidden = remaining === 0;
            document.getElementById('wishlist-page-empty').hidden = remaining !== 0;
            document.getElementById('wishlist-page-count').textContent = result.count;
          }
        }
      } catch (error) {
        if (action === 'cart') {
          if (countNode) countNode.textContent = oldCount || '';
        } else {
          if (countNode) countNode.textContent = Math.max(0, (Number(countNode.textContent) || 0) - delta) || '';
          button.classList.toggle('is-active', oldActive);
          button.setAttribute('aria-pressed', String(oldActive));
          updateMenuProduct('wishlist-items', card, productId, oldActive);
        }
        notify(error.message || 'Something went wrong. Please try again.');
      }
      finally {
        busy = false;
        if (action === 'cart') setBusy(button, false);
        else { button.disabled = false; button.setAttribute('aria-busy', 'false'); }
      }
    });
  });

  const dialog = document.getElementById('preview-dialog');
  document.querySelectorAll('[data-preview]').forEach(trigger => {
    const open = () => {
      const card = trigger.closest('[data-product-card]');
      if (!card) return;
      document.getElementById('preview-title').textContent = card.dataset.title;
      document.getElementById('preview-price').textContent = card.dataset.price;
      document.getElementById('preview-description').textContent = card.dataset.fullDescription;
      document.getElementById('preview-mark').textContent = card.dataset.title.charAt(0).toUpperCase();
      dialog.showModal();
    };
    trigger.addEventListener('click', open);
    trigger.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
  document.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());

  const updateBagTotals = () => {
    const lines = [...document.querySelectorAll('[data-bag-line]')];
    const count = lines.reduce((sum, line) => sum + (Number(line.querySelector('.quantity-value')?.textContent) || 0), 0);
    const total = lines.reduce((sum, line) => sum + (Number(line.dataset.lineTotal) || 0), 0);
    const money = new Intl.NumberFormat('en-IN', {style:'currency',currency:'INR',maximumFractionDigits:2});
    const bagCount = document.getElementById('bag-count');
    if (bagCount) bagCount.textContent = count || '';
    document.getElementById('bag-page-count')?.replaceChildren(String(count));
    document.getElementById('summary-item-count')?.replaceChildren(String(count));
    const subtotalText = money.format(total);
    const mrp = document.getElementById('summary-mrp');
    const subtotal = document.getElementById('bag-subtotal');
    if (mrp) mrp.textContent = subtotalText;
    if (subtotal) subtotal.textContent = subtotalText;
    return lines;
  };

  const syncQuantityControls = line => {
    const quantity = Number(line.querySelector('.quantity-value').textContent) || 1;
    line.querySelector('[data-cart-decrease]').disabled = quantity <= 1;
    line.querySelector('[data-cart-increase]').disabled = quantity >= 10;
  };
  document.querySelectorAll('[data-cart-increase], [data-cart-decrease]').forEach(button => {
    let busy = false;
    button.addEventListener('click', async () => {
      if (busy) return;
      const line = button.closest('[data-bag-line]');
      const quantityNode = line.querySelector('.quantity-value');
      const previousQuantity = Number(quantityNode.textContent) || 1;
      const delta = button.hasAttribute('data-cart-increase') ? 1 : -1;
      if ((delta > 0 && previousQuantity >= 10) || (delta < 0 && previousQuantity <= 1)) return;
      busy = true;
      const controls = [...line.querySelectorAll('[data-cart-increase], [data-cart-decrease]')];
      controls.forEach(control => { control.disabled = true; });
      quantityNode.textContent = previousQuantity + delta;
      line.dataset.lineTotal = Number(line.dataset.unitPrice) * (previousQuantity + delta);
      const money = new Intl.NumberFormat('en-IN', {style:'currency',currency:'INR',maximumFractionDigits:2});
      line.querySelector('.bag-line-total').textContent = money.format(Number(line.dataset.lineTotal));
      updateBagTotals();
      try {
        const endpoint = delta > 0 ? '/cart/increase' : '/cart/decrease';
        const response = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json','X-CSRF-Token':csrf}, body:JSON.stringify({product_id:button.dataset.productId})});
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not update the quantity.');
        quantityNode.textContent = result.quantity;
        line.dataset.lineTotal = result.line_total;
        line.querySelector('.bag-line-total').textContent = result.line_total_formatted;
        updateBagTotals();
        const bagCount = document.getElementById('bag-count');
        if (bagCount) bagCount.textContent = result.item_count || '';
      } catch (error) {
        quantityNode.textContent = previousQuantity;
        line.dataset.lineTotal = Number(line.dataset.unitPrice) * previousQuantity;
        line.querySelector('.bag-line-total').textContent = money.format(Number(line.dataset.lineTotal));
        updateBagTotals();
        notify(error.message || 'Something went wrong.');
      } finally {
        busy = false;
        controls.forEach(control => { control.disabled = false; });
        syncQuantityControls(line);
      }
    });
  });

  document.querySelectorAll('[data-cart-remove]').forEach(button => {
    let busy = false;
    button.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      button.disabled = true;
      const line = button.closest('[data-bag-line]');
      const productId = button.dataset.productId;
      try {
        const response = await fetch('/cart/remove', {method:'POST', headers:{'Content-Type':'application/json','X-CSRF-Token':csrf}, body:JSON.stringify({product_id:productId})});
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not remove this item.');
        line.remove();
        const lines = updateBagTotals();
        document.getElementById('bag-count').textContent = result.item_count || '';
        if (!lines.length) {
          document.getElementById('bag-lines').hidden = true;
          document.getElementById('bag-summary').hidden = true;
          document.getElementById('bag-page-empty').hidden = false;
        }
        notify('Removed from your bag.');
      } catch (error) {
        button.disabled = false;
        notify(error.message || 'Something went wrong.');
      } finally { busy = false; }
    });
  });
})();

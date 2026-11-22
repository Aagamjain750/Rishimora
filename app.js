<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token }}">
  <title>{% block title %}Rishmora — Crafted for Comfort{% endblock %}</title>
  <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css', v='mobile-fit-12') }}">
  {% block head %}{% endblock %}
</head>
<body class="{% block body_class %}{% endblock %}">
  {% block content %}{% endblock %}
  {% if session.get('user_id') %}
  <div class="bag-drawer-backdrop" id="bag-drawer-backdrop" hidden></div>
  <aside class="bag-drawer" id="bag-drawer" role="dialog" aria-modal="true"
         aria-labelledby="bag-drawer-title" aria-hidden="true" inert>
    <header class="bag-drawer-header">
      <div>
        <p class="eyebrow">RISHMORA / YOUR ORDER</p>
        <h2 id="bag-drawer-title">Your Bag <span id="bag-drawer-count"></span></h2>
      </div>
      <button class="bag-drawer-close" id="bag-drawer-close" type="button" aria-label="Close bag">&times;</button>
    </header>
    <p class="bag-drawer-message" id="bag-drawer-message" role="status" aria-live="polite"></p>
    <div class="bag-drawer-content">
      <ul class="bag-drawer-items" id="bag-drawer-items" aria-label="Items in your bag"></ul>
      <p class="bag-drawer-empty" id="bag-drawer-empty" hidden>Your bag is empty.</p>
    </div>
    <footer class="bag-drawer-footer">
      <div class="bag-drawer-subtotal"><span>Subtotal</span><strong id="bag-drawer-subtotal"></strong></div>
      <a class="button button-gold bag-drawer-checkout" href="{{ url_for('checkout_page') }}">Continue to checkout</a>
      <a class="bag-drawer-view" href="{{ url_for('bag_page') }}">View full bag</a>
    </footer>
  </aside>
    {% include "_chat_widget.html" %}
  {% endif %}
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <script src="{{ url_for('static', filename='js/app.js', v='mobile-fit-7') }}" defer></script>
  {% block scripts %}{% endblock %}
</body>
</html>

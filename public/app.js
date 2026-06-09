// State variables
let menuData = [];
let cart = [];
let activeCategory = 'all';
let searchKeyword = '';
let activeOrderId = localStorage.getItem('activeOrderId') || null;
let eventSource = null;
let currentLang = localStorage.getItem('lang') || 'en';
let currentOrder = null;

// DOM Elements
const storeStatusBadge = document.getElementById('store-status-badge');
const cartTrigger = document.getElementById('cart-trigger');
const cartQtyIndicator = document.getElementById('cart-qty-indicator');
const cartDrawer = document.getElementById('cart-drawer-panel');
const cartBackdrop = document.getElementById('cart-drawer-backdrop');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsWrapper = document.getElementById('cart-items-wrapper');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTotalAmount = document.getElementById('cart-total-amount');
const proceedToCheckoutBtn = document.getElementById('proceed-to-checkout-btn');
const checkoutModal = document.getElementById('checkout-modal-overlay');
const cancelCheckoutBtn = document.getElementById('cancel-checkout-btn');
const checkoutForm = document.getElementById('checkout-details-form');
const foodItemsContainer = document.getElementById('food-items-container');
const menuSearch = document.getElementById('menu-search');
const menuCategories = document.getElementById('menu-categories');
const heroActionBtn = document.getElementById('hero-action-btn');
const trackingView = document.getElementById('tracking-view');
const browseView = document.getElementById('browse-view');
const trackBackToMenuBtn = document.getElementById('track-back-to-menu-btn');
const whatsappConfirmBtn = document.getElementById('whatsapp-confirm-btn');

// Translations mapping
const uiTranslations = {
  en: {
    heroSubtitle: "Authentic • Delicious • Fresh",
    heroTitle: "Experience Real Taste at Gobites by Gopal",
    heroDesc: "Taste our signature recipes. Order online and receive real-time prep alerts.",
    heroCta: "Browse Food Menu",
    openHours: "Open Hours",
    storeClosed: "○ Closed Now",
    storeOpen: "● Open Now",
    storeChecking: "Checking...",
    callKitchen: "Call Kitchen",
    whatsappSupport: "WhatsApp Support",
    exploreMenu: "Explore Our Menu",
    exploreDesc: "Freshly made signature wok dishes and drinks.",
    searchPlaceholder: "Search fried rice, noodles...",
    allCategories: "All Items",
    categoryFriedRice: "Fried Rice",
    categoryNoodles: "Noodles",
    categoryBiryani: "Biryani",
    categorySnacks: "Snacks",
    categoryDrinks: "Drinks",
    cartTitle: "Your Order",
    cartEmpty: "Your cart is empty.<br>Add some delicious meals to get started!",
    cartSubtotal: "Subtotal",
    cartPackaging: "Packaging",
    cartTotal: "Total",
    checkoutBtn: "Checkout Order",
    modalTitle: "Checkout Details",
    fieldName: "Full Name *",
    fieldNamePlaceholder: "e.g. Ramesh Kumar",
    fieldPhone: "Phone Number *",
    fieldPhonePlaceholder: "e.g. 9876543210",
    fieldPhoneHelp: "10-digit mobile number",
    fieldNotes: "Special Instructions (Optional)",
    fieldNotesPlaceholder: "e.g. Extra spicy, no onions, etc.",
    checkoutTotal: "Total Price (incl. tax)",
    checkoutEst: "Estimated Prep Time",
    btnCancel: "Cancel",
    btnPlaceOrder: "Place Order",
    trackPlaced: "Order Successfully Placed!",
    trackPlacedDesc: "Thank you for choosing Gobites by Gopal. Your order is being processed.",
    step1Title: "Order Received",
    step1Desc: "Awaiting kitchen acceptance.",
    step2Title: "Preparing Food",
    step2Desc: "Our chefs are preparing your delicious meal.",
    step3Title: "Ready for Pickup",
    step3Desc: "Your order is packed and ready to go!",
    step4Title: "Picked Up",
    step4Desc: "Order completed. Hope to serve you again!",
    orderSummary: "Order Summary",
    totalPaid: "Total Paid",
    estWaitTime: "Estimated Wait Time",
    updatesRealTime: "Updates in real time",
    orderElse: "Order Something Else",
    footerDesc: "Experience premium fast food at Gobites by Gopal. Order online, pick up fresh, and enjoy our fast, fresh, spicy meals.",
    footerRights: "© 2026 Gobites by Gopal. All Rights Reserved.",
    footerMadeWith: "Made with ❤️ for your fast‑food cravings."
  },
  te: {
    heroSubtitle: "అథెంటిక్ • రుచికరమైన • తాజా",
    heroTitle: "గోబైట్స్ బై గోపాల్ వద్ద నిజమైన రుచిని అనుభవించండి",
    heroDesc: "మా ప్రత్యేక వంటకాలను రుచి చూడండి. ఆన్‌లైన్‌లో ఆర్డర్ చేయండి మరియు ప్రత్యక్ష తయారీ హెచ్చరికలను పొందండి.",
    heroCta: "మెనూ చూడండి",
    openHours: "పని వేళలు",
    storeClosed: "○ ప్రస్తుతం మూసివేయబడింది",
    storeOpen: "● ప్రస్తుతం తెరిచి ఉంది",
    storeChecking: "పరిశీలిస్తోంది...",
    callKitchen: "కిచెన్‌కి కాల్ చేయండి",
    whatsappSupport: "వాట్సాప్ సహాయం",
    exploreMenu: "మా మెనూను అన్వేషించండి",
    exploreDesc: "తాజా సిగ్నేచర్ వోక్ వంటకాలు మరియు పానీయాలు.",
    searchPlaceholder: "ఫ్రైడ్ రైస్, నూడుల్స్ సెర్చ్ చేయండి...",
    allCategories: "అన్ని వంటకాలు",
    categoryFriedRice: "ఫ్రైడ్ రైస్",
    categoryNoodles: "నూడుల్స్",
    categoryBiryani: "బిర్యానీ",
    categorySnacks: "స్నాక్స్",
    categoryDrinks: "డ్రింక్స్",
    cartTitle: "మీ ఆర్డర్",
    cartEmpty: "మీ కార్ట్ ఖాళీగా ఉంది.<br>ప్రారంభించడానికి కొన్ని రుచికరమైన వంటకాలను జోడించండి!",
    cartSubtotal: "సబ్ టోటల్",
    cartPackaging: "ప్యాకేజింగ్",
    cartTotal: "మొత్తం",
    checkoutBtn: "ఆర్డర్ చెక్అవుట్",
    modalTitle: "చెక్అవుట్ వివరాలు",
    fieldName: "పూర్తి పేరు *",
    fieldNamePlaceholder: "ఉదా. రమేష్ కుమార్",
    fieldPhone: "ఫోన్ నంబర్ *",
    fieldPhonePlaceholder: "ఉదా. 9876543210",
    fieldPhoneHelp: "10-అంకెల మొబైల్ నంబర్",
    fieldNotes: "ప్రత్యేక సూచనలు (ఐచ్ఛికం)",
    fieldNotesPlaceholder: "ఉదా. ఎక్కువ కారం, ఉల్లిపాయలు వద్దు, మొదలైనవి.",
    checkoutTotal: "మొత్తం ధర (పన్నుతో కలిపి)",
    checkoutEst: "అంచనా తయారీ సమయం",
    btnCancel: "రద్దు చేయి",
    btnPlaceOrder: "ఆర్డర్ చేయండి",
    trackPlaced: "ఆర్డర్ విజయవంతంగా పూర్తయింది!",
    trackPlacedDesc: "గోబైట్స్ బై గోపాల్ ఎంచుకున్నందుకు ధన్యవాదాలు. మీ ఆర్డర్ ప్రాసెస్ చేయబడుతోంది.",
    step1Title: "ఆర్డర్ అందింది",
    step1Desc: "వంటగది ఆమోదం కోసం వేచి ఉంది.",
    step2Title: "ఆహారం తయారీ",
    step2Desc: "మా వంటగాళ్లు మీ రుచికరమైన భోజనాన్ని తయారు చేస్తున్నారు.",
    step3Title: "పికప్‌కు సిద్ధంగా ఉంది",
    step3Desc: "మీ ఆర్డర్ ప్యాక్ చేయబడింది మరియు సిద్ధంగా ఉంది!",
    step4Title: "పికప్ చేసారు",
    step4Desc: "ఆర్డర్ పూర్తయింది. మళ్లీ సేవలందించే అవకాశం ఇవ్వండి!",
    orderSummary: "ఆర్డర్ సారాంశం",
    totalPaid: "చెల్లించిన మొత్తం",
    estWaitTime: "అంచనా సమయం",
    updatesRealTime: "నిజ సమయ నవీకరణలు",
    orderElse: "మరొకటి ఆర్డర్ చేయండి",
    footerDesc: "గోబైట్స్ బై గోపాల్ వద్ద ప్రీమియం ఫాస్ట్ ఫుడ్ అనుభవించండి. ఆన్‌లైన్‌లో ఆర్డర్ చేయండి, పికప్ చేసుకోండి మరియు మా వేగవంతమైన, తాజా, మసాలా భోజనాన్ని ఆస్వాదించండి.",
    footerRights: "© 2026 గోబైట్స్ బై గోపాల్. అన్ని హక్కులు ప్రత్యేకించబద్ధాయి.",
    footerMadeWith: "మీ ఫాస్ట్ ఫుడ్ కోరికల కోసం ❤️ తో తయారు చేయబడింది."
  }
};

const menuTranslations = {
  'Veg Noodles': 'వెజ్ నూడుల్స్',
  'Egg Noodles': 'ఎగ్ నూడుల్స్',
  'Chicken Noodles': 'చికెన్ నూడుల్స్',
  'Double Egg Chicken Noodles': 'డబుల్ ఎగ్ చికెన్ నూడుల్స్',
  'Paneer Noodles': 'పనీర్ నూడుల్స్',
  'Veg Fried Rice': 'వెజ్ ఫ్రైడ్ రైస్',
  'Egg Fried Rice': 'ఎగ్ ఫ్రైడ్ రైస్',
  'Chicken Fried Rice': 'చికెన్ ఫ్రైడ్ రైస్',
  'Double Egg Chicken Fried Rice': 'డబుల్ ఎగ్ చికెన్ ఫ్రైడ్ రైస్',
  'Paneer Fried Rice': 'పనీర్ ఫ్రైడ్ రైస్',
  'Veg Biryani': 'వెజ్ బిర్యానీ',
  'Egg Biryani': 'ఎగ్ బిర్యానీ',
  'Chicken Dum Biryani': 'చికెన్ దమ్ బిర్యానీ',
  'Paneer Biryani': 'పనీర్ బిర్యానీ',
  'Veg Manchurian': 'వెజ్ మంచూరియా',
  'Chicken Manchurian': 'చికెన్ మంచూరియా',
  'Chicken 65': 'చికెన్ 65',
  'Chilli Chicken': 'చిల్లీ చికెన్',
  'Paneer 65': 'పనీర్ 65',
  'Thums Up (250ml)': 'థమ్స్ అప్ (250ml)',
  'Sprite (250ml)': 'స్ప్రైట్ (250ml)',
  'Fresh Lime Soda': 'ఫ్రెష్ లైమ్ సోడా',
  'Mineral Water (1L)': 'మినరల్ వాటర్ (1L)'
};

const descTranslations = {
  'Stir-fried noodles with crisp seasonal vegetables and savory Chinese sauces.': 'తాజా కూరగాయలు మరియు రుచికరమైన చైనీస్ సాస్‌లతో వేయించిన నూడుల్స్.',
  'Stir-fried noodles with scrambled farm eggs, carrots, and spring onions.': 'స్క్రాంబుల్డ్ గుడ్లు, క్యారెట్లు మరియు ఉల్లిపాయ ముక్కలతో వేయించిన నూడుల్స్.',
  'Stir-fried noodles with tender chicken chunks, cabbage, carrots, and spices.': 'మెత్తటి చికెన్ ముక్కలు, క్యాబేజీ, క్యారెట్లు మరియు మసాలాలతో వేయించిన నూడుల్స్.',
  'Noodles with extra scrambled eggs and generous chicken chunks cooked in signature spices.': 'సిగ్నేచర్ మసాలాలలో వండిన అదనపు స్క్రాంబుల్డ్ గుడ్లు మరియు చికెన్ ముక్కలతో నూడుల్స్.',
  'Stir-fried noodles with soft cottage cheese (paneer) cubes and crunchy peppers.': 'మెత్తని పనీర్ ముక్కలు మరియు కరకరలాడే మిరియాలతో వేయించిన నూడుల్స్.',
  'Fluffy basmati rice stir-fried with finely chopped vegetables and aromatic spices.': 'సన్నగా తరిగిన కూరగాయలు మరియు సుగంధ ద్రవ్యాలతో వేయించిన బాస్మతి బియ్యం.',
  'Fragrant rice scrambled with farm eggs, light soy sauce, and spring onions.': 'కోడిగుడ్లు, లైట్ సోయా సాస్ మరియు ఉల్లిపాయ ముక్కలతో వేయించిన సువాసనగల అన్నం.',
  'Stir-fried rice with tender spiced chicken pieces and fresh greens.': 'మసాలా చికెన్ ముక్కలు మరియు తాజా ఆకుకూరలతో వేయించిన అన్నం.',
  'Wok-tossed rice loaded with double scrambled eggs and juicy chicken pieces.': 'డబుల్ స్క్రాంబుల్డ్ గుడ్లు మరియు జ్యుసి చికెన్ ముక్కలతో లోడ్ చేయబడిన వోక్-టాస్డ్ రైస్.',
  'Premium basmati rice tossed with spiced paneer cubes and vegetables.': 'మసాలా పనీర్ ముక్కలు మరియు కూరగాయలతో టాస్ చేసిన ప్రీమియం బాస్మతి బియ్యం.',
  'Aromatic basmati rice cooked with garden-fresh vegetables and secret spices.': 'సువాసనగల బాస్మతి బియ్యం, తాజా కూరగాయలు మరియు రహస్య మసాలాలతో వండిన అన్నం.',
  'Fragrant rice layered with boiled spiced eggs and caramelized onions.': 'మసాలా గుడ్లు మరియు దోరగా వేయించిన ఉల్లిపాయలతో పొరలుగా వండిన సువాసనగల అన్నం.',
  'Traditional slow-cooked layered basmati rice with marinated chicken and aromatic herbs.': 'మసాలా దట్టించిన చికెన్ మరియు సువాసనగల మూలికలతో సాంప్రదాయక పద్ధతిలో ఉడికించిన బాస్మతి బియ్యం.',
  'Spiced basmati rice layered with soft marinated paneer cubes and saffron.': 'మసాలా వేసిన పనీర్ ముక్కలు మరియు కుంకుమపువ్వుతో వండిన రుచికరమైన బాస్మతి అన్నం.',
  'Deep-fried vegetable dumplings tossed in a tangy, spicy Manchurian sauce.': 'కారంగా ఉండే మంచూరియా సాస్‌లో వేయించిన కూరగాయల డంప్లింగ్స్.',
  'Crispy chicken bites tossed in a sweet, spicy, and tangy Manchurian gravy.': 'తీపి, కారంగా ఉండే మంచూరియా గ్రేవీలో టాస్ చేసిన క్రిస్పీ చికెన్ ముక్కలు.',
  'Spicy, deep-fried chicken cubes marinated in yogurt and curry leaves.': 'పెరుగు మరియు కరివేపాకుతో మెరినేట్ చేసిన స్పైసీ, డీప్-ఫ్రైడ్ చికెన్ ముక్కలు.',
  'Crispy chicken chunks tossed with bell peppers, onions, and hot chili sauce.': 'క్యాప్సికమ్, ఉల్లిపాయలు మరియు హాట్ చిల్లీ సాస్‌తో టాస్ చేసిన క్రిస్పీ చికెన్ ముక్కలు.',
  'Crispy deep-fried paneer cubes tossed in a spicy tempered yogurt mixture.': 'మసాలా పెరుగు మిశ్రమంలో టాస్ చేసిన క్రిస్పీ డీప్-ఫ్రైడ్ పనీర్ ముక్కలు.',
  'Refreshing and strong carbonated cola beverage.': 'రిఫ్రెషింగ్ మరియు స్ట్రాంగ్ కార్బోనేటెడ్ కోలా పానీయం.',
  'Crisp, clean, refreshing lemon-lime flavored soda.': 'నిమ్మ-కాయ రుచితో కూడిన రిఫ్రెషింగ్ సోడా.',
  'Tangy and sparkling soda with freshly squeezed lime juice.': 'తాజా నిమ్మరసంతో తయారు చేసిన రుచికరమైన సోడా.',
  'Purified mineral drinking water bottle.': 'శుద్ధి చేయబడిన మినరల్ తాగునీటి సీసా.'
};

// Web Audio API Synthesized Chime (no external files needed)
function playReadyChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = audioCtx.currentTime;
    playTone(523.25, now, 0.4);      // C5
    playTone(659.25, now + 0.15, 0.6); // E5
  } catch (err) {
    console.warn('Web Audio chime failed:', err);
  }
}

// Apply Selected Language UI text replacements
function applyLanguage(lang) {
  const trans = uiTranslations[lang];
  if (!trans) return;

  // Header and Navigation
  const cartTriggerText = document.querySelector('#cart-trigger span');
  if (cartTriggerText) cartTriggerText.textContent = lang === 'en' ? 'Cart' : 'కార్ట్';

  // Hero Section
  const heroSubtitle = document.querySelector('.hero-subtitle');
  if (heroSubtitle) heroSubtitle.textContent = trans.heroSubtitle;
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) heroTitle.textContent = trans.heroTitle;
  const heroDesc = document.querySelector('.hero-desc');
  if (heroDesc) heroDesc.textContent = trans.heroDesc;
  const heroAction = document.getElementById('hero-action-btn');
  if (heroAction) heroAction.textContent = trans.heroCta;

  // Info Bar
  const infoLabels = document.querySelectorAll('.info-label');
  if (infoLabels.length >= 3) {
    infoLabels[0].textContent = trans.openHours;
    infoLabels[1].textContent = trans.callKitchen;
    infoLabels[2].textContent = trans.whatsappSupport;
  }

  // Menu Section
  const menuTitle = document.querySelector('.menu-title-area h2');
  if (menuTitle) menuTitle.textContent = trans.exploreMenu;
  const menuDesc = document.querySelector('.menu-title-area p');
  if (menuDesc) menuDesc.textContent = trans.exploreDesc;
  const searchInput = document.getElementById('menu-search');
  if (searchInput) searchInput.placeholder = trans.searchPlaceholder;

  // Category Tabs
  const tabButtons = document.querySelectorAll('.category-tabs .tab-btn');
  tabButtons.forEach(btn => {
    const cat = btn.dataset.category;
    if (cat === 'all') btn.textContent = trans.allCategories;
    else if (cat === 'Fried Rice') btn.textContent = trans.categoryFriedRice;
    else if (cat === 'Noodles') btn.textContent = trans.categoryNoodles;
    else if (cat === 'Chinese Starters') btn.textContent = currentLang === 'te' ? 'చైనీస్ స్టార్టర్స్' : 'Chinese Starters';
  });

  // Cart Drawer
  const cartHeader = document.querySelector('.cart-header h3');
  if (cartHeader) cartHeader.textContent = trans.cartTitle;
  const cartSubtotalLabel = document.querySelector('.cart-summary-row span');
  if (cartSubtotalLabel) cartSubtotalLabel.textContent = trans.cartSubtotal;
  const cartPackagingLabel = document.getElementById('cart-packaging-label');
  if (cartPackagingLabel) cartPackagingLabel.textContent = trans.cartPackaging;
  const cartTotalLabel = document.querySelector('.cart-total-row span');
  if (cartTotalLabel) cartTotalLabel.textContent = trans.cartTotal;
  const checkoutBtn = document.getElementById('proceed-to-checkout-btn');
  if (checkoutBtn) checkoutBtn.textContent = trans.checkoutBtn;

  // Checkout Modal
  const modalTitle = document.querySelector('.modal-title');
  if (modalTitle) modalTitle.textContent = trans.modalTitle;
  const nameLabel = document.querySelector('label[for="customer-name-field"]');
  if (nameLabel) nameLabel.textContent = trans.fieldName;
  const nameInput = document.getElementById('customer-name-field');
  if (nameInput) nameInput.placeholder = trans.fieldNamePlaceholder;
  const phoneLabel = document.querySelector('label[for="customer-phone-field"]');
  if (phoneLabel) phoneLabel.textContent = trans.fieldPhone;
  const phoneInput = document.getElementById('customer-phone-field');
  if (phoneInput) phoneInput.placeholder = trans.fieldPhonePlaceholder;
  const phoneHelp = document.querySelector('label[for="customer-phone-field"] ~ span');
  if (phoneHelp) phoneHelp.textContent = trans.fieldPhoneHelp;
  const notesLabel = document.querySelector('label[for="customer-notes-field"]');
  if (notesLabel) notesLabel.textContent = trans.fieldNotes;
  const notesInput = document.getElementById('customer-notes-field');
  if (notesInput) notesInput.placeholder = trans.fieldNotesPlaceholder;
  
  const checkoutRows = document.querySelectorAll('#checkout-details-form div[style*="background"] div');
  if (checkoutRows.length >= 2) {
    const span1 = checkoutRows[0].querySelector('span');
    if (span1) span1.textContent = trans.checkoutTotal;
    const span2 = checkoutRows[1].querySelector('span');
    if (span2) span2.textContent = trans.checkoutEst;
  }

  const cancelBtn = document.getElementById('cancel-checkout-btn');
  if (cancelBtn) cancelBtn.textContent = trans.btnCancel;
  const submitBtn = document.querySelector('#checkout-details-form button[type="submit"]');
  if (submitBtn) submitBtn.textContent = trans.btnPlaceOrder;

  // Tracking View
  const trackSuccessIcon = document.querySelector('.tracking-header h2');
  if (trackSuccessIcon) trackSuccessIcon.textContent = trans.trackPlaced;
  const trackSuccessDesc = document.querySelector('.tracking-header p');
  if (trackSuccessDesc) trackSuccessDesc.textContent = trans.trackPlacedDesc;

  const steps = ['pending', 'preparing', 'ready', 'completed'];
  steps.forEach(step => {
    const stepEl = document.getElementById(`step-${step}`);
    if (stepEl) {
      const titleEl = stepEl.querySelector('.timeline-step-title');
      const descEl = stepEl.querySelector('.timeline-step-desc');
      if (step === 'pending') {
        if (titleEl) titleEl.textContent = trans.step1Title;
        if (descEl && !descEl.querySelector('span')) descEl.textContent = trans.step1Desc;
      } else if (step === 'preparing') {
        if (titleEl) titleEl.textContent = trans.step2Title;
        if (descEl) descEl.textContent = trans.step2Desc;
      } else if (step === 'ready') {
        if (titleEl) titleEl.textContent = trans.step3Title;
        if (descEl) descEl.textContent = trans.step3Desc;
      } else if (step === 'completed') {
        if (titleEl) titleEl.textContent = trans.step4Title;
        if (descEl) descEl.textContent = trans.step4Desc;
      }
    }
  });

  const trackSummaryTitle = document.querySelector('#tracking-view h3');
  if (trackSummaryTitle) trackSummaryTitle.textContent = trans.orderSummary;
  
  const trackTotalPaidLabel = document.querySelector('#tracking-view div[style*="dotted"] span');
  if (trackTotalPaidLabel) trackTotalPaidLabel.textContent = trans.totalPaid;
  
  const trackWaitTimeLabel = document.querySelector('#tracking-est-time ~ span');
  if (trackWaitTimeLabel) trackWaitTimeLabel.textContent = trans.updatesRealTime;
  const trackWaitTimeParent = document.querySelector('#tracking-est-time');
  if (trackWaitTimeParent && trackWaitTimeParent.previousElementSibling) {
    trackWaitTimeParent.previousElementSibling.textContent = trans.estWaitTime;
  }
  
  const trackBackBtn = document.getElementById('track-back-to-menu-btn');
  if (trackBackBtn) trackBackBtn.textContent = trans.orderElse;

  // Footer
  const footerTitle = document.querySelector('footer h3');
  if (footerTitle) footerTitle.textContent = 'Gobites by Gopal';
  const footerDesc = document.querySelector('footer p');
  if (footerDesc) footerDesc.textContent = trans.footerDesc;
  const footerSocials = document.querySelectorAll('.footer-socials a');
  if (footerSocials.length >= 2) {
    footerSocials[0].innerHTML = '📞 ' + trans.callKitchen;
    footerSocials[1].innerHTML = '💬 ' + trans.whatsappSupport;
  }
  const footerRights = document.querySelector('.footer-content div span:nth-child(1)');
  if (footerRights) footerRights.textContent = trans.footerRights;
  const footerMadeWith = document.querySelector('.footer-content div span:nth-child(2)');
  if (footerMadeWith) footerMadeWith.textContent = trans.footerMadeWith;

  // Trigger checkStoreStatus to update badge in correct language
  checkStoreStatus();
}

// Check Store Open/Closed Timings (12:00 PM to 9:30 PM)
function checkStoreStatus() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // 12:00 PM (12:00) to 9:30 PM (21:30)
  const totalMinutes = currentHour * 60 + currentMinute;
  const startMinutes = 12 * 60; // 12:00 PM
  const endMinutes = 21 * 60 + 30; // 9:30 PM
  const isOpen = totalMinutes >= startMinutes && totalMinutes <= endMinutes;
  
  const trans = uiTranslations[currentLang];
  if (isOpen) {
    storeStatusBadge.className = 'badge badge-open';
    storeStatusBadge.textContent = trans ? trans.storeOpen : '● Open Now';
  } else {
    storeStatusBadge.className = 'badge badge-closed';
    storeStatusBadge.textContent = trans ? trans.storeClosed : '○ Closed Now';
  }
}

// Fetch Menu Data
async function fetchMenu() {
  try {
    const res = await fetch('/api/menu');
    const data = await res.json();
    if (data.success) {
      menuData = data.menu;
      renderMenu();
    } else {
      foodItemsContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center;color:var(--danger)">Failed to load menu.</div>`;
    }
  } catch (err) {
    console.error(err);
    foodItemsContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center;color:var(--danger)">Network error loading menu.</div>`;
  }
}

// Generate category inline placeholder SVGs for rich visual cards
function getFoodPlaceholderSVG(category, name) {
  let color = 'hsl(24, 100%, 50%)'; // default orange
  let emoji = '🍚';
  
  if (category === 'Fried Rice') {
    color = 'hsl(35, 90%, 55%)';
    emoji = '🍚';
  } else if (category === 'Noodles') {
    color = 'hsl(12, 85%, 50%)';
    emoji = '🍜';
  } else if (category === 'Biryani') {
    color = 'hsl(28, 80%, 45%)';
    emoji = '🍛';
  } else if (category === 'Snacks') {
    color = 'hsl(45, 95%, 50%)';
    emoji = '🥟';
  } else if (category === 'Drinks') {
    color = 'hsl(190, 85%, 45%)';
    emoji = '🥤';
  }

  // Beautiful stylized SVG cards
  return `data:image/svg+xml;utf8,<svg width="350" height="200" viewBox="0 0 350 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g_${name.replace(/\s+/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(220, 18%, 14%)"/>
        <stop offset="100%" stop-color="hsl(220, 15%, 8%)"/>
      </linearGradient>
      <radialGradient id="glow_${name.replace(/\s+/g, '')}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(%23g_${name.replace(/\s+/g, '')})"/>
    <circle cx="175" cy="100" r="80" fill="url(%23glow_${name.replace(/\s+/g, '')})"/>
    <circle cx="175" cy="100" r="50" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="175" y="115" font-family="'Outfit', sans-serif" font-size="48" text-anchor="middle">${emoji}</text>
  </svg>`;
}

// Render Menu Cards
function renderMenu() {
  let filtered = menuData.filter(f => !f.description || !f.description.includes('[HIDDEN]'));

  // Filter Category
  if (activeCategory !== 'all') {
    filtered = filtered.filter(f => f.category === activeCategory);
  }

  // Filter Search
  if (searchKeyword.trim() !== '') {
    const keyword = searchKeyword.toLowerCase();
    filtered = filtered.filter(f => 
      f.name.toLowerCase().includes(keyword) || 
      f.description.toLowerCase().includes(keyword)
    );
  }

  if (filtered.length === 0) {
    foodItemsContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding: 40px; color:var(--text-muted);">${currentLang === 'te' ? 'మీ శోధనకు సరిపోయే వంటకాలు ఏవీ లేవు.' : 'No dishes match your search.'}</div>`;
    return;
  }

  foodItemsContainer.innerHTML = filtered.map(item => {
    const isAvailable = !item.description || !item.description.includes('[OUT_OF_STOCK]');
    const cleanDesc = item.description ? item.description.replace('[OUT_OF_STOCK]', '').trim() : '';
    const name = currentLang === 'te' ? (menuTranslations[item.name] || item.name) : item.name;
    const description = currentLang === 'te' ? (descTranslations[cleanDesc] || cleanDesc) : cleanDesc;
    const category = currentLang === 'te' ? (uiTranslations.te[`category${item.category.replace(/\s+/g, '')}`] || item.category) : item.category;

    let actionBtnHtml = `
      <button class="add-cart-btn" onclick="addToCart(${item.id})" aria-label="Add to cart">
        <svg viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    `;
    if (!isAvailable) {
      const oosLabel = currentLang === 'te' ? 'అందుబాటులో లేదు' : 'Out of Stock';
      actionBtnHtml = `<span style="color: var(--danger); font-size: 0.85rem; font-weight: 700; text-transform: uppercase;">${oosLabel}</span>`;
    }

    return `
    <div class="food-card" data-id="${item.id}">
      <div class="food-img-container" data-category="${item.category}">
        <img class="food-img-svg" src="${item.image || getFoodPlaceholderSVG(item.category, item.name)}" onerror="this.onerror=null; this.src='${getFoodPlaceholderSVG(item.category, item.name)}';" alt="${name}">
        <span class="food-category-badge">${category}</span>
      </div>
      <div class="food-details">
        <h3 class="food-title">${name}</h3>
        <p class="food-desc">${description}</p>
        <div class="food-footer">
          <span class="food-price">₹${item.price}</span>
          ${actionBtnHtml}
        </div>
      </div>
    </div>
  `;
  }).join('');
}

// Cart State Management
function loadCart() {
  const localCart = localStorage.getItem('cart');
  if (localCart) {
    cart = JSON.parse(localCart);
    updateCartUI();
  }
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Add Item
window.addToCart = function addToCart(id) {
  const food = menuData.find(f => f.id === id);
  if (!food) return;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: food.id,
      name: food.name,
      price: food.price,
      category: food.category,
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();

  // Auto open cart drawer when adding first item
  if (cart.length === 1) {
    openCartDrawer();
  }

  // Fly-to-cart animation
  const btn = document.querySelector(`.food-card[data-id="${id}"] .add-cart-btn`);
  const img = btn.closest('.food-card').querySelector('.food-img-svg');
  if (btn && img) {
    const imgRect = img.getBoundingClientRect();
    const cartRect = cartTrigger.getBoundingClientRect();
    const clone = img.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.left = imgRect.left + 'px';
    clone.style.top = imgRect.top + 'px';
    clone.style.width = imgRect.width + 'px';
    clone.style.height = imgRect.height + 'px';
    clone.style.zIndex = 1000;
    clone.style.pointerEvents = 'none';
    document.body.appendChild(clone);
    const deltaX = cartRect.left + cartRect.width / 2 - (imgRect.left + imgRect.width / 2);
    const deltaY = cartRect.top + cartRect.height / 2 - (imgRect.top + imgRect.height / 2);
    document.documentElement.style.setProperty('--fly-x', `${deltaX}px`);
    document.documentElement.style.setProperty('--fly-y', `${deltaY}px`);
    clone.style.animation = 'flyToCart 0.8s forwards ease-in-out';
    clone.addEventListener('animationend', () => {
      clone.remove();
    });
  }

  // Badge bounce
  const badge = document.getElementById('cart-qty-indicator');
  if (badge) {
    badge.classList.add('cart-bounce');
    badge.addEventListener('animationend', () => {
      badge.classList.remove('cart-bounce');
    }, { once: true });
  }
};

// Update Item Quantity
window.updateQty = function(id, change) {
  const item = cart.find(item => item.id === id);
  if (!item) return;

  item.quantity += change;
  if (item.quantity <= 0) {
    cart = cart.filter(item => item.id !== id);
  }
  
  saveCart();
  updateCartUI();
};

// Remove Item
window.removeFromCart = function(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
};

// Calculate Estimated Preparation Time based on items count
function calculateEstPrepTime(totalQty) {
  if (totalQty <= 3) return 15;
  if (totalQty <= 6) return 25;
  return 35;
}

// Update Cart Sidebar UI
function updateCartUI() {
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartQtyIndicator.textContent = totalQty;
  
  if (cart.length === 0) {
    const emptyMsg = currentLang === 'te' 
      ? 'మీ కార్ట్ ఖాళీగా ఉంది.<br>ప్రారంభించడానికి కొన్ని రుచికరమైన వంటకాలను జోడించండి!' 
      : 'Your cart is empty.<br>Add some delicious meals to get started!';
    cartItemsWrapper.innerHTML = `
      <div class="empty-cart-view">
        <svg viewBox="0 0 24 24">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <p>${emptyMsg}</p>
      </div>
    `;
    cartSubtotal.textContent = '₹0.00';
    cartTotalAmount.textContent = '₹0.00';
    proceedToCheckoutBtn.disabled = true;
    proceedToCheckoutBtn.style.opacity = 0.5;
    proceedToCheckoutBtn.style.cursor = 'not-allowed';
    return;
  }

  proceedToCheckoutBtn.disabled = false;
  proceedToCheckoutBtn.style.opacity = 1;
  proceedToCheckoutBtn.style.cursor = 'pointer';

  cartItemsWrapper.innerHTML = cart.map(item => {
    const name = currentLang === 'te' ? (menuTranslations[item.name] || item.name) : item.name;
    return `
    <div class="cart-item">
      <div class="cart-item-img">
        <img src="${item.image || getFoodPlaceholderSVG(item.category, item.name)}" onerror="this.onerror=null; this.src='${getFoodPlaceholderSVG(item.category, item.name)}';" style="width:100%;height:100%;object-fit:cover;">
      </div>
      <div class="cart-item-details">
        <div class="cart-item-title">${name}</div>
        <div class="cart-item-price">₹${item.price}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
        <span class="qty-val">${item.quantity}</span>
        <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
      </div>
      <button class="remove-item-btn" onclick="removeFromCart(${item.id})" aria-label="Remove item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;
  }).join('');

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;

  cartSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
  cartTotalAmount.textContent = `₹${total.toFixed(2)}`;
}

// Drawer Toggles
function openCartDrawer() {
  cartDrawer.classList.add('open');
  cartBackdrop.style.display = 'block';
}

function closeCartDrawer() {
  cartDrawer.classList.remove('open');
  cartBackdrop.style.display = 'none';
}

// Cart UI Bindings
cartTrigger.addEventListener('click', openCartDrawer);
closeCartBtn.addEventListener('click', closeCartDrawer);
cartBackdrop.addEventListener('click', closeCartDrawer);

// Hero CTA Scroll to Menu
if (heroActionBtn) {
  heroActionBtn.addEventListener('click', () => {
    document.getElementById('menu-browsing').scrollIntoView({ behavior: 'smooth' });
  });
}

// Category Tabs Filters
menuCategories.addEventListener('click', (e) => {
  if (e.target.classList.contains('tab-btn')) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    activeCategory = e.target.dataset.category;
    renderMenu();
  }
});

// Search Input Filtering
menuSearch.addEventListener('input', (e) => {
  searchKeyword = e.target.value;
  renderMenu();
});

// Checkout Modal Actions
proceedToCheckoutBtn.addEventListener('click', () => {
  closeCartDrawer();
  
  // Calculate checkout figures
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const prepTime = calculateEstPrepTime(totalQty);

  document.getElementById('checkout-total-price').textContent = `₹${total.toFixed(2)}`;
  document.getElementById('checkout-est-time').textContent = `${prepTime} Mins`;
  
  checkoutModal.classList.add('open');
});

cancelCheckoutBtn.addEventListener('click', () => {
  checkoutModal.classList.remove('open');
});

// Form Submission (Place Order API)
checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const customerName = document.getElementById('customer-name-field').value;
  const phoneNumber = document.getElementById('customer-phone-field').value;
  const customerAddress = ''; // Enforced pickup-only workflow
  const specialInstructions = document.getElementById('customer-notes-field').value;

  const items = cart.map(i => ({
    food_id: i.id,
    quantity: i.quantity
  }));

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        phoneNumber,
        customerAddress,
        specialInstructions,
        items
      })
    });

    const data = await res.json();
    if (data.success) {
      // Clear Cart
      cart = [];
      saveCart();
      updateCartUI();

      // Show Order Tracking Screen
      activeOrderId = data.order.order_id;
      localStorage.setItem('activeOrderId', activeOrderId);
      checkoutModal.classList.remove('open');
      checkoutForm.reset();
      
      showTrackingView(activeOrderId);
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (err) {
    console.error(err);
    alert(currentLang === 'te' 
      ? 'ఆర్డర్ సమర్పించడంలో విఫలమైంది. దయచేసి మీ నెట్‌వర్క్ కనెక్షన్ తనిఖీ చేయండి.' 
      : 'Failed to place order. Please check your network connection.');
  }
});

// Real-Time SSE Order Status Updates & UI sync
function setupStatusEventListener() {
  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource('/api/events');

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'order-updated' && data.order && data.order.order_id == activeOrderId) {
        currentOrder = data.order;
        updateTrackingTimeline(data.order);
        
        // Play notification sound if status changed to 'Ready'
        if (data.order.status === 'Ready') {
          playReadyChime();
          triggerBrowserNotification(`Order Ready!`, `Your order #${activeOrderId} is ready for pickup!`);
        }
      }
    } catch (err) {
      console.error('SSE JSON Parse Error:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.error('SSE Connection lost. Retrying...', err);
  };
}

// Request Desktop Notifications
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function triggerBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '/favicon.ico'
    });
  }
}

// Load and render order tracking screen
async function showTrackingView(orderId) {
  try {
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    if (data.success) {
      const order = data.order;
      currentOrder = order;
      
      // Update Elements
      document.getElementById('tracking-order-id').textContent = `Order #${order.order_id}`;
      document.getElementById('tracking-total-price').textContent = `₹${order.total_price.toFixed(2)}`;
      
      const timeUnit = currentLang === 'te' ? ' నిమిషాలు' : ' Minutes';
      document.getElementById('tracking-est-time').textContent = `${order.estimated_time}${timeUnit}`;

      document.getElementById('tracking-items-list').innerHTML = order.items.map(i => {
        const name = currentLang === 'te' ? (menuTranslations[i.name] || i.name) : i.name;
        return `
        <div class="flex justify-between" style="color: var(--text-secondary);">
          <span>${i.quantity}x ${name}</span>
          <span>₹${(i.item_price * i.quantity).toFixed(2)}</span>
        </div>
      `;
      }).join('');

      updateTrackingTimeline(order);
      
      // Apply UI translations to other tracking screen elements
      applyLanguage(currentLang);
      
      // Toggle views
      browseView.style.display = 'none';
      trackingView.style.display = 'block';
      window.scrollTo(0, 0);

      // Start listening to SSE updates
      setupStatusEventListener();
      requestNotificationPermission();
    } else {
      console.error(data.message);
      // Clean stale tracking references
      activeOrderId = null;
      localStorage.removeItem('activeOrderId');
    }
  } catch (err) {
    console.error(err);
  }
}

// Update Timeline Progress Steps
function updateTrackingTimeline(order) {
  const statusEl = document.getElementById('tracking-order-status');
  if (statusEl) {
    let displayStatus = order.status;
    if (order.status === 'Pending Owner Approval') {
      displayStatus = '📦 Order Received';
    } else if (order.status === 'Pending') {
      displayStatus = '📦 Order Received';
    } else if (order.status === 'Preparing') {
      displayStatus = '👨🍳 Preparing Your Order';
    } else if (order.status === 'Ready') {
      displayStatus = '✅ Ready For Pickup';
    } else if (order.status === 'Completed') {
      displayStatus = '🎉 Order Completed';
    } else if (order.status === 'Cancelled') {
      displayStatus = '❌ Order Cancelled';
    }
    statusEl.textContent = displayStatus;
    statusEl.className = `order-status-badge-custom status-cust-${order.status.toLowerCase().replace(/\s+/g, '-')}`;
  }

  // Set visual states and short emoji texts
  const stepPendingTitle = document.querySelector('#step-pending .timeline-step-title');
  const stepPendingDesc = document.querySelector('#step-pending .timeline-step-desc');
  if (stepPendingTitle) stepPendingTitle.textContent = '📦 Order Received';
  if (stepPendingDesc) stepPendingDesc.textContent = 'Awaiting acceptance';

  const stepPreparingTitle = document.querySelector('#step-preparing .timeline-step-title');
  const stepPreparingDesc = document.querySelector('#step-preparing .timeline-step-desc');
  if (stepPreparingTitle) stepPreparingTitle.textContent = '👨🍳 Preparing';
  if (stepPreparingDesc) stepPreparingDesc.textContent = '🔥 Freshly Cooking';

  const stepReadyTitle = document.querySelector('#step-ready .timeline-step-title');
  const stepReadyDesc = document.querySelector('#step-ready .timeline-step-desc');
  if (stepReadyTitle) stepReadyTitle.textContent = '✅ Ready for Pickup';
  if (stepReadyDesc) stepReadyDesc.textContent = 'Your food is hot!';

  const stepCompletedTitle = document.querySelector('#step-completed .timeline-step-title');
  const stepCompletedDesc = document.querySelector('#step-completed .timeline-step-desc');
  if (stepCompletedTitle) stepCompletedTitle.textContent = '🎉 Order Completed';
  if (stepCompletedDesc) stepCompletedDesc.textContent = 'Enjoy your meal!';

  const steps = ['Pending Owner Approval', 'Preparing', 'Ready', 'Completed'];
  let currentIndex = steps.indexOf(order.status);
  if (currentIndex === -1 && order.status === 'Pending') {
    currentIndex = 0;
  }
  
  // Handle Cancellation State
  if (order.status === 'Cancelled') {
    const pendingStepDesc = document.querySelector('#step-pending .timeline-step-desc');
    if (pendingStepDesc) {
      let cancelText = '❌ Order Cancelled';
      if (order.special_instructions && order.special_instructions.includes('[Rejection Reason:')) {
        const parts = order.special_instructions.split('[Rejection Reason:');
        const reasonText = parts[1].replace(']', '').trim();
        cancelText += ` (${reasonText})`;
      }
      pendingStepDesc.innerHTML = `<span style="color:var(--danger);font-weight:700;">${cancelText}</span>`;
    }
    document.querySelectorAll('.timeline-step').forEach(step => {
      step.classList.remove('active', 'completed');
    });
    return;
  }

  // Set visual states
  steps.forEach((step, idx) => {
    const stepKey = step === 'Pending Owner Approval' ? 'pending' : step.toLowerCase();
    const stepEl = document.getElementById(`step-${stepKey}`);
    if (!stepEl) return;

    if (idx < currentIndex) {
      stepEl.classList.remove('active');
      stepEl.classList.add('completed');
    } else if (idx === currentIndex) {
      stepEl.classList.remove('completed');
      stepEl.classList.add('active');
    } else {
      stepEl.classList.remove('active', 'completed');
    }
  });

  // If order status is Completed, show feedback popup
  if (order.status === 'Completed') {
    const feedbackSubmitted = localStorage.getItem(`feedback_submitted_${order.order_id}`);
    if (!feedbackSubmitted) {
      showFeedbackPopup(order.order_id);
    }
  }
}

// Show feedback popup modal and handle API submission
function showFeedbackPopup(orderId) {
  const modal = document.getElementById('feedback-modal-overlay');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('open');

  // Reset feedback form state
  let selectedRating = 0;
  const stars = modal.querySelectorAll('.star-btn');
  stars.forEach(star => {
    star.classList.remove('active');
    star.textContent = '☆';
  });

  const tags = modal.querySelectorAll('.feedback-tag-btn');
  tags.forEach(tag => {
    tag.classList.remove('active');
  });

  document.getElementById('feedback-comment-field').value = '';

  // Setup star click listeners
  stars.forEach(star => {
    star.onclick = () => {
      selectedRating = parseInt(star.dataset.rating);
      stars.forEach(s => {
        const r = parseInt(s.dataset.rating);
        if (r <= selectedRating) {
          s.classList.add('active');
          s.textContent = '★';
        } else {
          s.classList.remove('active');
          s.textContent = '☆';
        }
      });
    };
  });

  // Setup tag click listeners
  tags.forEach(tag => {
    tag.onclick = () => {
      tag.classList.toggle('active');
    };
  });

  // Handle Form Submission
  const form = document.getElementById('feedback-form');
  form.onsubmit = async (e) => {
    e.preventDefault();

    if (selectedRating === 0) {
      alert('Please select a rating star.');
      return;
    }

    const taste = modal.querySelector('.feedback-tag-btn[data-tag="taste"]').classList.contains('active');
    const service = modal.querySelector('.feedback-tag-btn[data-tag="service"]').classList.contains('active');
    const quality = modal.querySelector('.feedback-tag-btn[data-tag="quality"]').classList.contains('active');
    const comment = document.getElementById('feedback-comment-field').value;

    try {
      const res = await fetch(`/api/orders/${orderId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selectedRating, taste, service, quality, comment })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(`feedback_submitted_${orderId}`, 'true');
        modal.style.display = 'none';
        modal.classList.remove('open');
        alert('Thank you for your feedback!');
      } else {
        alert(`Failed to submit feedback: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting feedback. Please try again.');
    }
  };
}

// Return back to main catalog
trackBackToMenuBtn.addEventListener('click', () => {
  activeOrderId = null;
  localStorage.removeItem('activeOrderId');
  
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  trackingView.style.display = 'none';
  browseView.style.display = 'block';
  window.scrollTo(0, 0);
});

if (whatsappConfirmBtn) {
  whatsappConfirmBtn.addEventListener('click', () => {
    // Validate order details
    if (!currentOrder) {
      alert('Error: Order details not found or loaded yet.');
      return;
    }
    if (!currentOrder.order_id) {
      alert('Error: Order ID is missing.');
      return;
    }
    if (!currentOrder.customer_name || currentOrder.customer_name.trim() === '') {
      alert('Error: Customer name is missing.');
      return;
    }
    if (!currentOrder.phone_number || currentOrder.phone_number.trim() === '') {
      alert('Error: Phone number is missing.');
      return;
    }
    if (!currentOrder.items || !Array.isArray(currentOrder.items) || currentOrder.items.length === 0) {
      alert('Error: Ordered items are missing.');
      return;
    }

    // Generate the WhatsApp message dynamically from actual order data
    const itemsText = currentOrder.items
      .map(item => `${item.name} x ${item.quantity}`)
      .join('\n\n');

    const message = `🔥 Gobites by Gopal

New Pickup Order

Order ID:
#${currentOrder.order_id}

Customer:
${currentOrder.customer_name}

Phone:
${currentOrder.phone_number}

Items:

${itemsText}

Order Total:
₹${currentOrder.total_price.toFixed(2)}

Estimated Preparation Time:
${currentOrder.estimated_time} Minutes

Pickup Location:

Gopi Fast Food Center
Quality Inn Ramachandra Opposite
Duvvada Road
Kurmannapalem
Visakhapatnam - 530046

Contact:
9392119020

Thank you.`;

    // Mobile vs Desktop routing
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const phone = '919392119020';
    const encodedText = encodeURIComponent(message);
    let whatsappUrl = '';

    if (isMobile) {
      whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
    } else {
      whatsappUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
    }

    window.open(whatsappUrl, '_blank');
  });
}

// App Startup Initializations
applyLanguage(currentLang);

const langSwitcher = document.getElementById('language-switcher');
if (langSwitcher) {
  langSwitcher.value = currentLang;
  langSwitcher.addEventListener('change', (e) => {
    currentLang = e.target.value;
    localStorage.setItem('lang', currentLang);
    applyLanguage(currentLang);
    renderMenu();
    updateCartUI();
  });
}

checkStoreStatus();
setInterval(checkStoreStatus, 60000); // refresh shop status every minute

fetchMenu();
loadCart();

// If customer has an active tracking order, load it immediately
if (activeOrderId) {
  showTrackingView(activeOrderId);
}

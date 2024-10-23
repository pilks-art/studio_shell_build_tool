// Reference to the creative's various properties and elements.
var creative = {};
var dynamicBuilder = {};
dynamicBuilder.data = [];

/**
 * Called on the window load event.
 */
function preInit() {
  // live
  if (Enabler.isInitialized()) {
    // check if parent page has loaded
    if (Enabler.isPageLoaded()) {
      politeLoad();
    } else {
      Enabler.addEventListener(
        studio.events.StudioEvent.PAGE_LOADED,
        politeLoad
      );
    }
  } else {
    // if local emulate polite load
    Enabler.addEventListener(studio.events.StudioEvent.INIT, preInit);
  }
}

/**
 * load required scripts
 */
function politeLoad() {
  Enabler.loadScript("https://s0.2mdn.net/creatives/assets/1951882/dynamicBuilder.min.js",init);
}

/**
 * The Enabler is now initialized and any extra modules have been loaded.
 */
function init() {
  initializeDynamicData();
}

/**
 * Setup the creative data obj here
 */
function initializeDynamicData() {
  creative.data = {};
  creative.exit = {};
  creative.data.url = dynamicContent.data[0].Data_Url;
  creative.exit.url = dynamicContent.data[0].Exit_Url.Url;

  buildData();
}

function buildData() {
  var xobj = new XMLHttpRequest();
  var url = creative.data.url;
  xobj.overrideMimeType("application/json");
  xobj.open("GET", url, true);
  xobj.onreadystatechange = function() {
    if (xobj.readyState == 4 && xobj.status == "200") {
      var data = xobj.responseText;
      dynamicBuilder.data = JSON.parse(data);
      buildDOM(".dynamicAdvertContainer", dynamicBuilder.data);
      setupDom();
      // if ad is visible
      if (Enabler.isVisible()) {
        show();
      } else {
        Enabler.addEventListener(studio.events.StudioEvent.VISIBLE, show);
      }
    }
  };
  xobj.send(null);
}

/**
 * Set up references to DOM elements.
 */
function setupDom() {
  creative.dom = {};
  creative.dom.mainContainer = document.querySelector(".dynamicAdvertContainer");
  addListeners();
}

/**
 * Add appropriate listeners after the creative's DOM has been set up.
 */
function addListeners() {
  // If ORCA creative then comment out below
  //creative.dom.mainContainer.addEventListener('click', exitClickHandler);
}

/**
 *  Shows the ad.
 */
function show() {
  creative.dom.mainContainer.style.display = "block";
  startAnimation(0);
}

function exitClickHandler() {
  Enabler.exitOverride("DynamicExit", creative.exit.url);
}

/**
 *  Main onload handler
 */
window.addEventListener("load", preInit);
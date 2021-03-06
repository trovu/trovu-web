/** @module AddToBrowser */

import { detect, browserName } from "detect-browser";

import Helper from "./../Helper.js";

/** Set and manage the "Add to Browser" functionality. */

export default class BrowserAdd {
  constructor(env) {
    this.env = env;

    this.setProcessUrlTemplateTextarea();
    this.setBrowserTab();
  }

  /**
   * Add Opensearch tag.
   */
  static addLinkSearch() {
    const paramStr = location.hash.substr(1);
    const xml = `<link 
    rel="search" 
    type="application/opensearchdescription+xml" 
    href="/opensearch/?${paramStr}" 
    title="Trovu" 
    />`;
    const head = document.querySelector("head");
    head.innerHTML += xml;
  }

  /**
   * Get the base URL of the current location.
   *
   * @return {string} - The built base URL.
   */
  getBaseUrl() {
    let baseUrl = "";

    baseUrl += window.location.protocol;
    baseUrl += "//";
    baseUrl += window.location.hostname;
    baseUrl += window.location.pathname;

    // Remove index.html.
    baseUrl = baseUrl.replace("index.html", "");

    return baseUrl;
  }

  /**
   * Set the textarea in the "Add to browser" modal.
   */
  setProcessUrlTemplateTextarea() {
    const baseUrl = this.getBaseUrl();
    const params = this.env.getParams();

    // Set Process URL.
    const urlProcess =
      baseUrl + "process/?#" + Helper.getUrlParamStr(params) + "&query=%s";
    const preProcessUrl = document.querySelector(".process-url");

    preProcessUrl.textContent = urlProcess;
  }

  /**
   * Autoselect the right tab, based on current browser.
   */
  setBrowserTab() {

    // Default: 'other'.
    let browserName = 'other';

    const browser = detect();
    if (browser && browser.name && ['firefox', 'chrome'].includes(browser.name)) {
      browserName = browser.name;
    }

    // Deactivate all.
    document
      .querySelectorAll("#add-to-browser .nav-tabs a")
      .forEach((el) => el.classList.remove("active"));
    document
      .querySelectorAll("#add-to-browser .tab-pane")
      .forEach((el) => el.classList.remove("show", "active"));

    // Set current.
    document
      .querySelector("#add-to-browser .nav-tabs a." + browserName)
      .classList.add("active");
    document
      .querySelector("#add-to-browser .tab-pane." + browserName)
      .classList.add("show", "active");
  }
}

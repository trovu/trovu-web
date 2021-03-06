/** @module Suggestions */

import awesomplete from "awesomplete";
import "awesomplete/awesomplete.css";

import Helper from "./Helper.js";
import QueryParser from "./QueryParser.js";

/** Set and manage the Suggestions. */

export default class Suggestions {
  constructor(namespaces, submitQuery) {
    this.namespaces = namespaces;
    this.submitQuery = submitQuery;

    const queryInput = document.querySelector("#query");

    this.awesomplete = new Awesomplete(queryInput, {
      container: function (input) {
        return input.parentNode;
      },
      minChars: 1,
      filter: function (text, input) {
        return true;
      },
      list: [],
      sort: false,
      item: this.renderAwesompleteItem,
    });

    queryInput.addEventListener("input", this.updateSuggestions);
    // Also update on focus,
    // for case when input is already filled (because no shortcut was not found).
    queryInput.addEventListener("focus", this.updateSuggestions);
    queryInput.addEventListener("awesomplete-select", this.select);
  }

  /**
   * Handle change query input field.
   *
   * @param {object} event – The fired event.
   */
  updateSuggestions = (event) => {
    const inputText = event.target.value;

    // Only search by keyword / first word of user input.
    const [keyword, argumentString] = Helper.splitKeepRemainder(
      inputText,
      " ",
      2
    );
    const suggestions = this.getSuggestions(keyword);

    const list = this.convertSuggestionsToAwesompleteList(suggestions);
    this.awesomplete.list = list.slice(0, 10);

    this.awesomplete.evaluate();
  };

  /**
   * Render a suggestion item.
   */
  renderAwesompleteItem(listItem, input, id) {
    const li = document.createElement("li", {
      role: "option",
    });

    const argument_names = Object.keys(listItem.label.arguments).join(", ");

    li.innerHTML = `
    <span${listItem.label.reachable ? `` : ` class="unreachable"`}>
      <span class="left">  
      <span class="keyword">${listItem.label.keyword}</span>  
      <span class="argument-names">${argument_names}</span> 
      </span>
      <span class="right">
        <span class="title">${listItem.label.title}</span>
        <span class="namespace">${listItem.label.namespace}</span>
      </span>
    </span>
    `;
    return li;
  }

  /**
   * Find shortcuts to suggest.
   *
   * @param {string} keyword – The keyword from the query.
   *
   * @return {array} suggestions – The found suggestions.
   */
  getSuggestions(keyword) {
    const matches = this.getMatches(keyword);
    this.sortMatches(matches);

    let suggestions = [];
    suggestions = suggestions.concat(
      matches.keywordFullReachable,
      matches.keywordFullUnreachable,
      matches.keywordBeginReachable,
      matches.keywordBeginUnreachable,
      matches.titleBeginReachable,
      matches.titleBeginUnreachable,
      matches.titleMiddleReachable,
      matches.titleMiddleUnreachable
    );
    suggestions = suggestions.slice(0, 10);

    return suggestions;
  }

  /**
   * Find matches given keyword.
   *
   * @param {string} keyword – The keyword from the query.
   *
   * @return {object} matches – The found matches, grouped by type of match.
   */
  getMatches(keyword) {
    const matches = {
      keywordFullReachable: [],
      keywordFullUnreachable: [],
      keywordBeginReachable: [],
      keywordBeginUnreachable: [],
      titleBeginReachable: [],
      titleBeginUnreachable: [],
      titleMiddleReachable: [],
      titleMiddleUnreachable: [],
    };

    for (const namespace of this.namespaces) {
      for (const shortcut of Object.values(namespace.shortcuts)) {
        if (keyword == shortcut.keyword) {
          if (shortcut.reachable) {
            matches.keywordFullReachable.push(shortcut);
          } else {
            matches.keywordFullUnreachable.push(shortcut);
          }
          continue;
        }
        let pos = shortcut.keyword.search(new RegExp(keyword, "i"));
        if (pos == 0) {
          if (shortcut.reachable) {
            matches.keywordBeginReachable.push(shortcut);
          } else {
            matches.keywordBeginUnreachable.push(shortcut);
          }
          continue;
        }
        pos = shortcut.title.search(new RegExp(keyword, "i"));
        if (pos == 0) {
          if (shortcut.reachable) {
            matches.titleBeginReachable.push(shortcut);
          } else {
            matches.titleBeginUnreachable.push(shortcut);
          }
          continue;
        }
        if (pos > 0) {
          if (shortcut.reachable) {
            matches.titleMiddleReachable.push(shortcut);
          } else {
            matches.titleMiddleUnreachable.push(shortcut);
          }
          continue;
        }
      }
    }
    return matches;
  }

  /**
   * Sort matches based on keyword.
   *
   * @param {string} keyword – The keyword from the query.
   */
  sortMatches(matches) {
    for (const key in matches) {
      matches[key].sort((a, b) => {
        return a.keyword < b.keyword ? -1 : 1;
      });
    }
  }

  /**
   * Convert Suggestions to Awesomplete list format.
   *
   * @param {array} suggestions – The found suggestions.
   *
   * @return {array} list – The found suggestions, converted for Awesomplete.
   */
  convertSuggestionsToAwesompleteList(suggestions) {
    const list = [];
    for (const suggestion of suggestions) {
      const item = {
        value: "", // We are not using this on select.
        label: suggestion,
      };
      list.push(item);
    }
    return list;
  }
  /**
   * Handle selection of a suggestion.
   *
   * @param {object} event – The fired event.
   */
  select = (event) => {
    event.preventDefault();

    const inputText = event.target.value;
    const input = QueryParser.parse(inputText);
    const suggestion = event.text.label;

    if (suggestion.argumentCount == 0) {
      this.awesomplete.replace({ value: suggestion.keyword });
      this.submitQuery();
      return;
    }

    this.awesomplete.replace({
      value: suggestion.keyword + " " + input.argumentString,
    });

    if (input.args.length == suggestion.argumentCount) {
      this.submitQuery();
      return;
    }
    this.updateSuggestions(event);
  };
}

// Requires cors.js to be loaded first

"use strict";

var SOLR_CONFIG = {
    "server": "https://arcticdata.io/metacat/d1/mn/v2/query/solr?",  // Solr server
    "filter": "knb-lter-bnz",  // Filter results for an organization or user
    "limit": 10,  // Max number of results to retrieve per page
    "resultsElementId": "searchResults",  // Element to contain results
    "urlElementId": "searchUrl",  // Element to display search URL
    "countElementId": "resultCount",  // Element showing number of results
    "pagesElementId": "pagination",  // Element to display result page links
    "showPages": 5  // MUST BE ODD NUMBER! Max number of page links to show
};


// Get URL arguments
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


// Parse Solr search results into HTML
function parseSolrResults(resultJson) {
    var docs = resultJson["response"]["docs"];
    var html = [];
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i];
        var names = doc["origin"].join(", ") + " ";
        var date = "(Published " + doc["datePublished"].slice(0, 10) + ")";
        var link = doc["resourceMap"][0];
        if (link.slice(0, 4) == "doi:") {
            link = "http://dx.doi.org/" + link.slice(4);
        }
        var title = '<a rel="external" href="' + link + '" target="_blank">' + 
                    doc["title"].trim() + '</a>';
        var row = '<p><span class="dataset-title">' + title + 
                  '</span><br><span class="dataset-author">' + names + date +
                  '</span></p>';
        html.push(row);
    }
    if (html.length) {
        return html.join("\n");
    }
    else {
        return "<p>Your search returned no results.</p>";
    }
}


function show_loading(isLoading) {
    var x = document.getElementById("loading-div");
    if (isLoading) {
        document.body.style.cursor = "wait";
        x.style.display = "block";
    }
    else {
        document.body.style.cursor = "default";
        x.style.display = "none";
    }
}


// Function to call if CORS request is successful
function successCallback(headers, response) {
    show_loading(false);

    // Write results to page
    document.getElementById("searchResults").innerHTML = response;
    var data = JSON.parse(response);
    var resultHtml = parseSolrResults(data);
    var elementId = SOLR_CONFIG["resultsElementId"];
    document.getElementById(elementId).innerHTML = resultHtml;

    // Add links to additional search result pages if necessary
    var currentStart = getParameterByName("start");
    if (!currentStart) {
        currentStart = 0;
    }
    else {
        currentStart = parseInt(currentStart);
    }
    var count = parseInt(data["response"]["numFound"]);
    var limit = parseInt(SOLR_CONFIG["limit"]);
    var showPages = parseInt(SOLR_CONFIG["showPages"]);
    var pageElementId = SOLR_CONFIG["pagesElementId"];
    showPageLinks(count, limit, showPages, currentStart, pageElementId);
    var query = getParameterByName("q");
    if (query) query = query.trim();
    var coreArea = getParameterByName("coreArea");
    if (coreArea && coreArea !== "any") {
        if (!(query && query.trim())) {
            query = coreArea + " core area"
        }
        else {
            query += " in " + coreArea + " core area";
        }
    }    
    showResultCount(query, count, limit, currentStart, SOLR_CONFIG["countElementId"]);
}


// Function to call if CORS request fails
function errorCallback() {
    show_loading(false);
    alert("There was an error making the request.");
}


// Writes CORS request URL to the page so user can see it
function showUrl(url) {
    var txt = '<a href="' + url + '" target="_blank">' + url + '</a>';
    var element = document.getElementById(SOLR_CONFIG["urlElementId"]);
    element.innerHTML = txt;
}


// Passes search URL and callbacks to CORS function
function searchSolr(query, coreArea="", start=0) {
    var base = SOLR_CONFIG["server"];
    var fields = ["title",
                  "origin",
                  "datePublished",
                  "resourceMap"].toString();
    var params = "fl=" + fields + "&defType=edismax&wt=json";
    var limit = "&rows=" + SOLR_CONFIG["limit"];
    start = "&start=" + start;
    query = "&q=" + SOLR_CONFIG["filter"] + " " + query;
    if (coreArea && coreArea !== "any") {
        params += '&fq=keywords:"' + coreArea + '"';
    }
    var url = base + params + limit + start + query;
    showUrl(url);
    show_loading(true);
    makeCorsRequest(url, successCallback, errorCallback);
}


// When the window loads, read query parameters and perform search
window.onload = function() {
    var query = getParameterByName("q");
    if (query) query = query.trim();
    var start = getParameterByName("start");
    var coreArea = getParameterByName("coreArea");
    document.forms.dataSearchForm.q.value = query;
    if (!(query && query.trim())) {
        query = "";  // default for empty query
    }

    var areas = document.getElementById("coreArea");
    for (var i=0; i < areas.length; i++) {
        if (coreArea == areas[i].value) {
            areas[i].selected = true;
            break;
        }
    }
    
    if (!start) {
        start = 0;
    }
    searchSolr(query, coreArea, start);
};
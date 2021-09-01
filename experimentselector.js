function showVariationSelector() {

    var existingIframe = document.getElementById('experiment-iframe-container');
    if (existingIframe) {
        existingIframe.parentNode.removeChild(existingIframe);
    }

    document.getElementById('modal-experiment-dialog').style.display = "block";

    setTimeout(function () {
        document.getElementById('modal-experiment-dialog-content').style.maxHeight = '1000px';
    }, 0);
}

(function () {

    var isResizing = false;
    var lastDownX = 0;

    function initialise() {

        addDialog();

        var optimizely = window["optimizely"] && typeof window["optimizely"].get === "function";
        var experiments = optimizely ? window["optimizely"].get("data").experiments : null;
        var experimentSelector = document.getElementById("experimentId");
        var variationSelector = document.getElementById("variationId");
        var includeDrafts = document.getElementById("include-drafts");
        var viewVariationButton = document.getElementById("view-variation");
        var compareVariationButton = document.getElementById("compare-variation");
        var closeButton = document.getElementById("modal-experiment-dialog__close-button");

        addEventListeners();
        checkForOptimizely();

        function addDialog() {

            var modalDialog = document.createElement("div");
            modalDialog.id = "modal-experiment-dialog";
            modalDialog.className = "modal-experiment-dialog";
            document.body.appendChild(modalDialog);

            document.getElementById("modal-experiment-dialog").innerHTML = ' \
      <div id="modal-experiment-dialog-content"> \
        <div id="modal-experiment-dialog__close-button">&times;</div> \
        <h1>Optimizely experiment selector</h1> \
        <div id="modal-experiment-dialog-form-wrapper"> \
          <form> \
            <label for="experimentId">Experiment</label> \
            <select id="experimentId"></select> \
            <div id="variation-selection"> \
              <label for="variationId">Variation</label> \
              <select id="variationId"></select> \
            </div> \
            <div id="include-drafts-container"> \
              <input id="include-drafts" type="checkbox"> \
              <label for="include-drafts">Include drafts <span>(refreshes page)</span></label> \
            </div> \
            <button id="view-variation" type="button">View variation</button> \
            <button id="compare-variation" type="button">A/B comparison</button> \
          </form> \
        </div> \
      </div> \
    ';

            addStyleString(styles);

            setTimeout(function () {
                document.getElementById('modal-experiment-dialog-content').style.maxHeight = '1000px';
            }, 0);

        }

        function checkForOptimizely() {
            if (!optimizely) {
                document.getElementById("modal-experiment-dialog-form-wrapper").innerHTML = "<p>Optimizely X not found</p>";
            } else {
                checkDraftExperimentsCookie();
                populateExperimentList();
                setIncludeDraftsToggle();
            }
        }

        function checkDraftExperimentsCookie() {
            if (window["optimizely"].get("data").groups && getCookie("show-optly-draft-experiments")) {
                toggleDraftExperiments(true);
            }
        }

        function populateExperimentList() {
            if (experiments) {
                for (var experiment in experiments) {
                    var option = document.createElement('option');
                    option.value = experiment;
                    option.text = experiments[experiment].name.length > 100 ? experiments[experiment].name.substring(0, 50) + "..." : experiments[experiment].name;
                    experimentSelector.add(option);
                }
                setCurrentExperiment();
                populateVariationList(experimentSelector.options[experimentSelector.selectedIndex].value);
            } else {
                document.getElementById("modal-experiment-dialog-form-wrapper").innerHTML = "<p>No experiments found</p>";
            }
        }

        function setCurrentExperiment() {
            var variationId = getQueryStringValue("optimizely_x");
            if (variationId) {
                var experimentId;
                for (var experiment in experiments) {
                    var variations = experiments[experiment].variations;
                    for (var i = 0; i < variations.length; i++) {
                        if (variations[i].id === variationId) {
                            experimentId = experiment;
                            break;
                        }
                    }
                }
                setSelectedIndex(experimentSelector, experimentId);
            }
        }

        function populateVariationList(variationId) {
            variationSelector.options.length = 0;
            var variations = experiments[variationId].variations;
            for (var variation in variations) {
                var option = document.createElement('option');
                option.value = variations[variation].id;
                option.text = variations[variation].name.length > 100 ? variations[variation].name.substring(0, 50) + "..." : variations[variation].name;
                variationSelector.add(option);
            }
            document.getElementById("variation-selection").style.display = "block";
            setSelectedIndex(variationSelector, getQueryStringValue("optimizely_x"));
        }

        function addEventListeners() {
            experimentSelector.addEventListener("change", function () {
                populateVariationList(experimentSelector.options[experimentSelector.selectedIndex].value);
            });

            includeDrafts.addEventListener("click", function () {
                toggleDraftExperiments(includeDrafts.checked);
            });

            viewVariationButton.addEventListener("click", function () {
                showVariation(variationSelector.options[variationSelector.selectedIndex].value);
            });

            compareVariationButton.addEventListener("click", function () {
                compareVariation(variationSelector.options[variationSelector.selectedIndex].value);
            });

            closeButton.addEventListener("click", function () {
                document.getElementById('modal-experiment-dialog').style.display = "none";
                document.getElementById('modal-experiment-dialog-content').style.maxHeight = 0;
            });

            window.onclick = function (event) {
                if (event.target == document.getElementById('modal-experiment-dialog')) {
                    document.getElementById('modal-experiment-dialog').style.display = "none";
                    document.getElementById('modal-experiment-dialog-content').style.maxHeight = 0;
                }
            };

            document.onmousemove = function (e) {
                if (!isResizing) {
                    return;
                }
                if (e.clientX >= 0 && e.clientX <= (document.documentElement.clientWidth - 20)) {
                    var percentageWidth = ((e.clientX / window.innerWidth) * 100);
                    var iframeContainer = document.getElementById("experiment-iframe-container");
                    iframeContainer.style.left = percentageWidth + "%";
                    document.getElementById("experiment-iframe").style.transform = "translateX(" + -(iframeContainer.offsetLeft) + "px)";
                }
            }

        }

        function getQueryStringValue(key) {
            return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
        }

        function setIncludeDraftsToggle() {
            includeDrafts.checked = getQueryStringValue("optimizely_token") || !window["optimizely"].get("data").groups;
        }

    }

    function showVariation(variationId) {
        window.location.replace(getRedirectUrl(variationId));
    }

    function compareVariation(variationId) {

        var redirectUrl = getRedirectUrl(variationId);

        var iframeContainer = document.createElement("div");
        iframeContainer.id = "experiment-iframe-container";

        var iframeHandle = document.createElement("div");
        iframeHandle.id = "experiment-iframe-handle";
        var iframeHandleGrabber = document.createElement("span");
        iframeHandleGrabber.innerHTML = "&harr;";
        iframeHandle.appendChild(iframeHandleGrabber);
        iframeContainer.appendChild(iframeHandle);

        var iframe = document.createElement("iframe");
        iframe.id = "experiment-iframe";
        iframe.className = "experiment-iframe";
        iframe.src = redirectUrl;
        iframeContainer.appendChild(iframe);

        iframeLoader = document.createElement("div");
        iframeLoader.id = "experiment-iframe-loader";
        iframeLoader.innerHTML = "Please wait, loading variation...";
        iframeContainer.appendChild(iframeLoader);

        document.body.appendChild(iframeContainer);

        document.getElementById('modal-experiment-dialog').style.display = "none";

        iframe.style.transform = "translateX(" + -(iframeContainer.offsetLeft) + "px)";

        iframeHandle.onmousedown = function (e) {
            isResizing = true;
            lastDownX = e.clientX;
            document.getElementById("experiment-iframe").style.pointerEvents = "none";
        };

        iframeHandle.onmouseup = function (e) {
            isResizing = false;
            document.getElementById("experiment-iframe").style.pointerEvents = "auto";
        }

        iframe.onload = function () {
            try {
                var iframeBody = document.getElementById("experiment-iframe").contentWindow.document;
                document.getElementById("experiment-iframe").style.display = 'block';
            }
            catch (err) {
                document.getElementById("experiment-iframe-loader").innerHTML = "Unable to load variation.<br>Check X-Frame-Options";
            }
        }

        window.document.body.onscroll = function (e) {
            document.getElementById("experiment-iframe").contentWindow.scrollTo(0, window.scrollY);
        };

        window.document.body.onresize = function (e) {
            document.getElementById("experiment-iframe").style.transform = "translateX(" + -(iframeContainer.offsetLeft) + "px)";
        };
    }

    function getRedirectUrl(variationId) {
        var redirectUrl = window.location.href;

        redirectUrl = redirectUrl.replace('#?', '?#');

        if (redirectUrl.indexOf("?") === -1) {
            redirectUrl = redirectUrl + "?" + "optimizely_x=" + variationId;
        } else if (redirectUrl.indexOf("optimizely_x=") === -1) {
            redirectUrl = redirectUrl.replace(/([^?]+\?)/gi, "$1optimizely_x=" + variationId + "&");
        } else {
            redirectUrl = redirectUrl.replace(/optimizely_x=\d+/gi, "optimizely_x=" + variationId);
        }

        return redirectUrl;
    }

    function toggleDraftExperiments(includeDrafts) {

        var redirectUrl = window.location.href;

        document.getElementById("modal-experiment-dialog-form-wrapper").innerHTML = "<p>Please wait, reloading...</p>";

        if (includeDrafts) {
            setCookie("show-optly-draft-experiments", true, 10)
            if (redirectUrl.indexOf("?") === -1) {
                redirectUrl = redirectUrl + "?" + "optimizely_token=public";
            } else if (redirectUrl.indexOf("optimizely_token=") === -1) {
                redirectUrl = redirectUrl.replace(/([^?]+\?)/i, "$1optimizely_token=public&");
            }
        } else {
            deleteCookie("show-optly-draft-experiments")
            redirectUrl = redirectUrl.replace(/optimizely_token=public&?/i, "").replace(/\?$/, "");
        }

        window.location.replace(redirectUrl);

    }

    function setSelectedIndex(s, valsearch) {
        for (i = 0; i < s.options.length; i++) {
            if (s.options[i].value == valsearch) {
                s.options[i].selected = true;
                break;
            }
        }
        return;
    }

    function addStyleString(str) {
        var node = document.createElement('style');
        node.innerHTML = str;
        document.body.appendChild(node);
    }

    function getCookie(name) {
        var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
        return v ? v[2] : null;
    }

    function setCookie(name, value, days) {
        var d = new Date;
        d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
        document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
    }

    function deleteCookie(name) { setCookie(name, '', -1); }

    var styles = " \
    body { \
      max-width: 100% !important; \
      overflow-x: hidden !important; \
    } \
    #modal-experiment-dialog { \
      position: fixed; \
      z-index: 10000000000; \
      margin: 0; \
      left: 0; \
      top: 0; \
      width: 100%; \
      height: 100%; \
      overflow: auto; \
      background-color: rgba(0,0,0,0.6); \
      font-family: 'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif !important; \
      font-weight: 300 !important; \
    } \
    #modal-experiment-dialog h1 { \
      font-size: 18px !important; \
      color: #000 !important; \
      margin: 0 !important; \
      padding: 10px 0 20px 0 !important; \
      font-weight: 300 !important; \
      font-family: 'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif !important; \
    } \
    #modal-experiment-dialog #modal-experiment-dialog-content { \
      background-color: #FFF; \
      margin: auto; \
      padding: 15px 20px; \
      border-radius: 0 0 5px 5px; \
      width: 80%; \
      font-size: 15px; \
      line-height: 1.42857; \
      color: #4e585c; \
      max-width: 800px; \
      border-bottom: 8px solid #674186; \
      overflow: hidden; \
      max-height: 0; \
      transition: max-height 1s ease-in-out; \
    } \
    #modal-experiment-dialog select { \
      width: 100% !important; \
      font-size: 13px !important; \
      padding: 9px !important; \
      margin-bottom: 20px !important; \
      background-color: #FFF !important; \
      border: 1px solid #ccc; \
    } \
    #modal-experiment-dialog label { \
      display: inline-block; \
      font-size: 15px; \
      font-weight: 300 !important; \
      line-height: 1.42857; \
      color: #4e585c; \
      margin-bottom: 5px; \
    } \
    #modal-experiment-dialog button { \
      margin: 10px 0 !important; \
      background-color: #674186; \
      color: #FFF; \
      border: none; \
      padding: 8px 28px !important; \
      border-radius: 5px !important; \
      margin: 20px auto 20px !important; \
      font-size: 15px !important; \
      display: block; \
    } \
    #modal-experiment-dialog #view-variation { \
      width: 60%; \
    } \
    #modal-experiment-dialog #compare-variation { \
      display: none; \
      background-color: #FFF; \
      color: #000; \
      border: 1px solid #000; \
    } \
    #modal-experiment-dialog #modal-experiment-dialog__close-button { \
      color: #000; \
      font-size: 28px; \
      font-weight: bold; \
      width: 100%; \
      text-align: right; \
      margin-bottom: 10px; \
      line-height: 20px; \
    } \
    #modal-experiment-dialog #modal-experiment-dialog__close-button:hover, \
    #modal-experiment-dialog #modal-experiment-dialog__close-button:focus { \
      color: #000; \
      text-decoration: none; \
      cursor: pointer; \
    } \
    #modal-experiment-dialog #variation-selection { \
      display: none; \
    } \
    #modal-experiment-dialog #include-drafts-container { \
      padding: 8px 0 10px 0; \
    } \
    #modal-experiment-dialog #include-drafts-container span { \
      font-size: 10px; \
    } \
    #modal-experiment-dialog [type=\"checkbox\"]:not(:checked), #modal-experiment-dialog [type=\"checkbox\"]:checked { \
      position: absolute !important; \
      left: -9999px !important; \
    } \
    #modal-experiment-dialog [type=\"checkbox\"]:not(:checked) + label, #modal-experiment-dialog [type=\"checkbox\"]:checked + label { \
      position: relative !important; \
      padding-left: 3.9em !important; \
      padding-top: .25em !important; \
      cursor: pointer !important; \
    } \
    #modal-experiment-dialog [type=\"checkbox\"]:not(:checked) + label:before, #modal-experiment-dialog [type=\"checkbox\"]:checked + label:before, #modal-experiment-dialog [type=\"checkbox\"]:not(:checked) +  label:after, #modal-experiment-dialog [type=\"checkbox\"]:checked + label:after { \
      content: ''; \
      position: absolute !important; \
      height: 1.5em !important; \
      transition: all .5s ease !important; \
    } \
    #modal-experiment-dialog [type=\"checkbox\"]:not(:checked) + label:before, #modal-experiment-dialog [type=\"checkbox\"]:checked + label:before { \
      left: 0 !important; \
      top: 0 !important; \
      width: 3em !important; \
      border: 2px solid #dddddd !important; \
      background: #dddddd !important; \
      border-radius: 1.1em !important; \
      box-sizing: initial !important; \
    } \
    #modal-experiment-dialog [type=\"checkbox\"]:not(:checked) + label:after, #modal-experiment-dialog [type=\"checkbox\"]:checked + label:after { \
      left: 0.13em !important; \
      top: 0.16em !important; \
      background-color: #fff !important; \
      border-radius: 50% !important; \
      width: 1.5em !important; \
    } \
    #modal-experiment-dialog [type=\"checkbox\"]:checked + label:after { left: 1.6em !important; } \
    #modal-experiment-dialog [type=\"checkbox\"]:checked + label:before { \
      background-color: #72da67 !important; \
      border-color: #72da67 !important;\
    } \
    #experiment-iframe-container { \
      position: fixed; \
      top: 0; \
      left: 50%; \
      width: 100%; \
      height: 100%; \
      overflow-x: hidden; \
      z-index: 100000000000; \
      display: none; \
    } \
    #experiment-iframe { \
      width: 100vw; \
      height: 100vh; \
      z-index: 100000; \
      position: absolute; \
      border: none; \
      display: none; \
    } \
    #experiment-iframe-handle { \
      width: 20px; \
      height: 100%; \
      position: absolute; \
      top: 0; \
      left: 0; \
      z-index: 10000000000; \
      background-color: green; \
      cursor: w-resize; \
      opacity: 0.8; \
      display: flex; \
      align-items: center; \
      justify-content: center; \
      user-select: none; \
    } \
    #experiment-iframe-handle span { \
      color: #FFF; \
      user-select: none; \
      font-size: 14px; \
    } \
    #experiment-iframe-loader { \
      display: flex; \
      justify-content: center; \
      align-items: center; \
      width: 50%; \
      height: 100%; \
      background-color: #AAA; \
      color: #FFF; \
    } \
    @media screen and (min-width: 480px) { \
      #modal-experiment-dialog h1 { \
        font-size: 22px !important; \
      } \
      #modal-experiment-dialog select { \
        height: 36px; \
      } \
      #modal-experiment-dialog #compare-variation { \
        display: block; \
      } \
      #experiment-iframe-container { \
        display: block; \
      } \
    } \
  ";

    initialise();

})();
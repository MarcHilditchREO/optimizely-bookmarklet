# Experiment selector

Visual A/B comparison of Optimizely tests

## Usage

Add a bookmark, call it "Optimizely variation selector", and paste the code below in the URL field 

```
javascript:(function() {if (!document.getElementById('variation-selector-script')) {var jsCode=document.createElement('script'); jsCode.setAttribute('id','variation-selector-script'); jsCode.setAttribute('src', 'https://marchilditchreo.github.io/optimizely-bookmarklet/experimentselector.js'); document.body.appendChild(jsCode);} else {showVariationSelector()}}());
```
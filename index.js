// Globals
const browserUrlListId = 'urlList';
// Local Storage
const aLocalStorageUrlList = JSON.parse(localStorage.getItem(browserUrlListId));

let aUrlList = [];
let redirectUrl = "https://google.com";

// DOM Constants
const addUrlBtn = document.getElementById("addUrlBtn");
const inputUrl = document.getElementById("inputUrl");
const ulUrls = document.getElementById("ulUrls");

if (aLocalStorageUrlList) {
    aUrlList = aLocalStorageUrlList;
    renderUrlList();
}

addUrlBtn.addEventListener("click", function() {
    if (inputUrl.value != "") {
        aUrlList.push(inputUrl.value);
        inputUrl.value = "";
    }
    updateLocalStorageUrlList();
    renderUrlList();
});

function renderUrlList () {
    let urlInnerHtml = '';
    for (let i = 0; i < aUrlList.length; i++) {
        urlInnerHtml += `<li>${aUrlList[i]}</li>`;
    }

    ulUrls.innerHTML = urlInnerHtml;
}

function updateLocalStorageUrlList () {
    localStorage.setItem(browserUrlListId, JSON.stringify(aUrlList));
}
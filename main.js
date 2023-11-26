const articles = [];
const RENDER_EVENT = 'render-article';
const SAVED_EVENT = 'saved-article';
const STORAGE_KEY = 'BOOK_APPS';

function isStorageExist() {
    if (typeof (Storage) === undefined) {
        alert('Browser kamu tidak mendukung local storage');
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', function() {

    const submitForm = document.getElementById('inputArticle');
    submitForm.addEventListener('submit', function (event) {
        event.preventDefault();
        addArticle();
    });

    // checkbox
    const checkbox = document.getElementById('inputArticleIsComplete');
    const articleStatus = document.getElementById('articleStatus');
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            articleStatus.innerText = 'Selesai dibaca';
        } else {
            articleStatus.innerText = 'Belum selesai dibaca';
        }
    });

    if (isStorageExist()) {
        loadDataFromStorage();
    }

    const searchForm = document.getElementById('searchArticle');
    searchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const searchTitle = document.getElementById('searchArticleTitle').value.trim();
        if (searchTitle === '') {
        Swal.fire({
            icon: 'warning',
            title: 'Tolong tulis judul dahulu',
            showConfirmButton: false,
            timer: 1500
        });
        } else {
        const searchResults = searchArticlesByTitle(searchTitle);
        renderSearchResults(searchResults);
        }
    });
});

function addArticle() {
    const titleArticle = document.getElementById('inputArticleTitle').value;
    const authorArticle = document.getElementById('inputArticleAuthor').value;
    const yearArticle = document.getElementById('inputArticleYear').value;
    const yearArticleNumber = parseInt(yearArticle, 10);
    
    let isComplete = false;
    const checkbox = document.getElementById('inputArticleIsComplete');
    if (checkbox.checked) {
        isComplete = true;
    }
    
    const generatedID = generateId();
    const articleObject = generateArticleObject(generatedID, titleArticle, authorArticle, yearArticleNumber, isComplete);
    articles.push(articleObject);

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
}

function generateId() {
    return +new Date();
}

function generateArticleObject(id, title, author, year, isComplete) {
    return {
        id,
        title,
        author,
        year,
        isComplete
    }
}

document.addEventListener(RENDER_EVENT, function () {
    console.log(articles);
    const uncompletedBOOKList = document.getElementById('incompleteArticleshelfList');
    uncompletedBOOKList.innerHTML = '';

    const completedBOOKList = document.getElementById('completeArticleshelfList');
    completedBOOKList.innerHTML = '';
    
    for (const articleItem of articles) {
        const articleElement = makeArticle(articleItem);
        if (!articleItem.isComplete) {
            uncompletedBOOKList.append(articleElement);
        } else {
            completedBOOKList.append(articleElement);
        }
    }
});

function makeArticle(articleObject) {
    const titleArticle = document.createElement('h3');
    titleArticle.innerText = capitalizeWords(articleObject.title);

    const authorArticle = document.createElement('p');
    authorArticle.innerText = `Penulis: ${capitalizeWords(articleObject.author)}`;

    const yearArticle = document.createElement('p');
    yearArticle.innerText = `Tahun: ${articleObject.year}`;

    const actionContainer = document.createElement('div');
    actionContainer.classList.add('action');

    const actionButton = document.createElement('button');
    if (articleObject.isComplete) {
        actionButton.innerText = 'Belum selesai dibaca';
        actionButton.classList.add('green');

        actionButton.addEventListener('click', function () {
        undoTaskFromCompleted(articleObject.id);
        });
    } else {
        actionButton.innerText = 'Selesai dibaca';
        actionButton.classList.add('green');

        actionButton.addEventListener('click', function () {
        addTaskToCompleted(articleObject.id);
        });
    }

    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Hapus artikel';
    deleteButton.classList.add('red');

    deleteButton.addEventListener('click', function () {
        removeTaskFromCompleted(articleObject.id);
    });

    actionContainer.append(actionButton, deleteButton);

    const textArticleItem = document.createElement('div');
    textArticleItem.classList.add('article_list');
    textArticleItem.append(titleArticle, authorArticle, yearArticle, actionContainer);

    const articleItem = document.createElement('article');
    articleItem.classList.add('article_item');
    articleItem.setAttribute('id', `article-${articleObject.id}`);
    articleItem.append(textArticleItem);

    return articleItem;
}

function capitalizeWords(str) {
    return str.replace(/\b\w/g, function(char) {
        return char.toUpperCase();
    }).replace(/\b\w+\b/g, function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
}


function addTaskToCompleted (articleId) {
    const articleTarget = findArticle(articleId);
    if (articleTarget == null) return;
    articleTarget.isComplete = true;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
}

function findArticle(articleId) {
    for (const articleItem of articles) {
        if (articleItem.id === articleId) {
            return articleItem;
        }
    }
    return null;
}

function removeTaskFromCompleted(articleId) {
    const articleTarget = findArticle(articleId);
    if (!articleTarget) return;

    Swal.fire({
        title: 'Apakah Anda yakin?',
        html: `Anda akan menghapus artikel <strong>"${capitalizeWords(articleTarget.title)}"</strong> dari rak artikel.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Gak jadi deh'
    }).then((result) => {
        if (result.isConfirmed) {
            const articleIndex = findArticleIndex(articleId);
            if (articleIndex !== -1) {
                articles.splice(articleIndex, 1);
                document.dispatchEvent(new Event(RENDER_EVENT));
                saveData();
                Swal.fire(
                    'Sip!',
                    'Artikel telah dihapus.',
                    'success'
                );
            }
        }
    });
}


function undoTaskFromCompleted(articleId) {
    const articleTarget = findArticle(articleId);
    if (articleTarget == null) return;
    articleTarget.isComplete = false;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
}

function findArticleIndex(articleId) {
    for (const index in articles) {
        if (articles[index].id === articleId) {
            return index;
        }
    }
    return -1;
}

function saveData() {
    if (isStorageExist()) {
        const parsed = JSON.stringify(articles);
        localStorage.setItem(STORAGE_KEY, parsed);
        document.dispatchEvent(new Event(SAVED_EVENT));
    }
}

document.addEventListener(SAVED_EVENT, function () {
    console.log(localStorage.getItem(STORAGE_KEY));
});

function loadDataFromStorage() {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    let data = JSON.parse(serializedData);

    if (data !== null) {
        for (const article of data) {
            articles.push(article);
        }
    }

    document.dispatchEvent(new Event(RENDER_EVENT));
}

function searchArticlesByTitle(title) {
    const matchedArticles = [];
    const lowerCaseTitle = title.toLowerCase();
    for (const articleItem of articles) {
        const articleTitle = articleItem.title.toLowerCase();
        if (articleTitle.includes(lowerCaseTitle)) {
        matchedArticles.push(articleItem);
        }
    }
    return matchedArticles;
}

function renderSearchResults(results) {
    const searchResultsContainer = document.getElementById('searchArticleshelfList');
    searchResultsContainer.innerHTML = '';

    if (results.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Tidak ada hasil yang cocok',
            showConfirmButton: false,
            timer: 1500
        });
        return;
    }

    for (const result of results) {
        const resultItem = makeArticle(result);
        searchResultsContainer.appendChild(resultItem);
    }
}

const closeSearchButton = document.getElementById('closeSearchResults');
closeSearchButton.addEventListener('click', function() {
    const searchArticleshelfList = document.getElementById('searchArticleshelfList');
    searchArticleshelfList.innerHTML = '';
});

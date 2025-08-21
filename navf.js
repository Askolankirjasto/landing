document.addEventListener('DOMContentLoaded', function() {
    // Ensure the overlay functions are defined
    function openNavLuokka() {
        document.getElementById("myNavLuokka").style.width = "100%";
    }

    function closeNavLuokka() {
        document.getElementById("myNavLuokka").style.width = "0%";
    }

    function openNav() {
        document.getElementById("myNav").style.width = "100%";
    }

    function closeNav() {
        document.getElementById("myNav").style.width = "0%";
    }

    // Set up event listeners for opening and closing the overlays
    document.getElementById('openNavLuokka').addEventListener('click', function(event) {
        event.preventDefault();
        openNavLuokka();
    });

    document.getElementById('closeNavLuokka').addEventListener('click', function(event) {
        event.preventDefault();
        closeNavLuokka();
    });

    document.getElementById('openNav').addEventListener('click', function(event) {
        event.preventDefault();
        openNav();
    });

    document.getElementById('closeNav').addEventListener('click', function(event) {
        event.preventDefault();
        closeNav();
    });

    // Close the overlay when any of the specified elements are clicked
    const closeElements = ['grade1lk', 'grade2lk', 'grade3lk', 'grade4lk', 'grade5lk', 'grade6lk'];
    closeElements.forEach(id => {
        document.getElementById(id).addEventListener('click', function(event) {
            event.preventDefault(); // Prevent the default action
            closeNavLuokka(); // Close the overlay
            // Handle grade selection
            const selectedGrade = this.getAttribute('data-grade'); // Get the grade from the data attribute
            const selectedLibrary = document.getElementById('mySelect').value;
            fadeOutAndFetchBookData(selectedLibrary, selectedGrade);

            // Update the grade link text
            const gradeLink = document.querySelector('#openNavLuokka');
            const gradeNumber = selectedGrade.match(/\d+/)[0]; // Extract the number from "Grade X"
            gradeLink.textContent = `${gradeNumber}. luokka ☰`;
        });
    });

    // Additional code for populating libraries and books
    const apiUrl = 'https://hellefinna.helle-extranet.fi/wp-json/wp/v2/lukudiplomi';
    const libApiUrl = 'https://hellefinna.helle-extranet.fi/wp-json/custom/v1/libraries';
    let bookData = [];
    let mixer;

    async function populateLibraryList() {
        try {
            const response = await fetch(libApiUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            const selectElement = document.getElementById('mySelect');
            selectElement.innerHTML = '';

            const uniqueLibraries = Object.values(data);

            const sortedLibraries = uniqueLibraries.sort();
            sortedLibraries.forEach(library => {
                const option = document.createElement('option');
                option.value = library;
                option.textContent = library;
                selectElement.appendChild(option);
            });

            selectElement.value = 'Askola';
            const urlParams = new URLSearchParams(window.location.search);
            const selectedLibrary = urlParams.get('kirjasto');
            if (selectedLibrary && sortedLibraries.includes(selectedLibrary)) {
                selectElement.value = selectedLibrary;
            }

            // Fetch and populate book data for the default library and grade
            const defaultGrade = 'Grade 1';
            await fadeOutAndFetchBookData(selectElement.value, defaultGrade);
        } catch (error) {
            console.error('Error fetching the library list:', error);
        }
    }

    async function fadeOutAndFetchBookData(library, grade = 'Grade 1') {
        const galleryContainer = document.getElementById('menufilter');
        const galleryItems = galleryContainer.querySelectorAll('.gallery-item');

        // Fade out the current gallery items
        galleryItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.8)';
        });

        // Wait for the fade-out transition to complete
        setTimeout(async () => {
            await fetchAndFilterBookData(library, grade);
            window.scrollTo(0, 0); // Scroll to the top of the page
        }, 300); // Match this duration with the CSS transition duration
    }

    async function fetchAndFilterBookData(library, grade = 'Grade 1') {
        try {
            const perPage = 70;
            const response = await fetch(`${apiUrl}?library=${library}&grade=${grade}&per_page=${perPage}`);
            if (!response.ok) throw new Error('Network response was not ok');
            bookData = await response.json();

            // Destroy the current MixItUp instance if it exists
            if (mixer) {
                mixer.destroy();
                mixer = null;
            }

            // Process the data as before
            filterBookData(library, grade, 'all');

        } catch (error) {
            console.error('Error fetching the book data:', error);
        }
    }

    function sanitizeCategory(category) {
        return category.replace(/[^a-zA-Z0-9]/g, '');
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function filterBookData(library, grade = 'Grade 1', category = 'all') {
        const filtersContainer = document.getElementById('filters');
        filtersContainer.innerHTML = '';

        const uniqueCategories = new Set();
        bookData.forEach(item => {
            if (item.acf && item.acf.category) {
                uniqueCategories.add(item.acf.category);
            }
        });

        // Sort categories alphabetically
        const sortedCategories = Array.from(uniqueCategories).sort();

        sortedCategories.forEach(category => {
            const filter = document.createElement('span');
            filter.className = 'filter filter-item myanimate filter-item2';
            filter.setAttribute('data-filter', `.${sanitizeCategory(category)}`);
            filter.textContent = category;
            filtersContainer.appendChild(filter);

            const newGalleryItems = galleryContainer.querySelectorAll('.gallery-item');
    newGalleryItems.forEach(item => {
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        item.style.opacity = '1';
        item.style.transform = 'scale(1)';
    });

    // Scroll to top after fade-in
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 600);
        });

        // Add "Kaikki" category as the last filter
        const allFilter = document.createElement('span');
        allFilter.className = 'filter filter-item myanimate filter-item2';
        allFilter.setAttribute('data-filter', 'all');
        allFilter.textContent = 'Kaikki';
        filtersContainer.appendChild(allFilter);

        const galleryContainer = document.getElementById('menufilter');
        galleryContainer.innerHTML = '';

        // Remove existing modals
        document.querySelectorAll('.modal').forEach(modal => modal.remove());

        // Shuffle the bookData if the category is "all"
        const filteredBookData = category === 'all' ? shuffleArray([...bookData]) : bookData;

        filteredBookData.forEach((item, index) => {
            const sanitizedCategory = sanitizeCategory(item.acf.category);
            if (category === 'all' || sanitizedCategory === sanitizeCategory(category)) {
                const galleryItem = document.createElement('div');
                galleryItem.className = `gallery-item ${sanitizedCategory}`;
                galleryItem.setAttribute('data-bs-toggle', 'modal');
                galleryItem.setAttribute('data-bs-target', `#Modal${index}`);

                // Initially hide the new items
                galleryItem.style.opacity = '0';
                galleryItem.style.transform = 'scale(0.8)';

                const innerDiv = document.createElement('div');
                innerDiv.className = 'gallery-item-inner';

                const hoverEffectDiv = document.createElement('div');
                hoverEffectDiv.className = 'hovereffect';

                const img = document.createElement('img');
                img.src = item.acf.cover
                    ? `${item.acf.cover}` // Use the imageSrc method for the cover
                    : `https://helle.finna.fi/Cover/Show?source=Solr&size=large&recordid=${item.acf.id}`;
                img.alt = item.acf.title;

                const overlayDiv = document.createElement('div');
                overlayDiv.className = 'overlay';

                const title = document.createElement('h2');
                title.textContent = item.acf.title;

                const infoButton = document.createElement('button');
                infoButton.type = 'button';
                infoButton.className = 'btn btn-primary over myanimate';
                infoButton.textContent = 'Lisää tietoa';

                overlayDiv.appendChild(title);
                overlayDiv.appendChild(infoButton);
                hoverEffectDiv.appendChild(img);
                hoverEffectDiv.appendChild(overlayDiv);
                innerDiv.appendChild(hoverEffectDiv);
                galleryItem.appendChild(innerDiv);
                galleryContainer.appendChild(galleryItem);

                // Create modal for each book
                createModal(item, index);
            }
        });

        // Initialize MixItUp with animation settings
        mixer = mixitup(galleryContainer, {
            selectors: {
                target: '.gallery-item'
            },
            animation: {
                duration: 600, // Increase the duration for a smoother animation
                effects: 'fade scale(0.5) translateZ(-100px)', // Combine fade, scale, and translateZ effects
                easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)' // Custom easing for a more dynamic effect
            },
            load: {
                filter: 'all' // Ensure all items are shown on load
            }
        });

        // Fade in the new gallery items
        const newGalleryItems = galleryContainer.querySelectorAll('.gallery-item');
        newGalleryItems.forEach(item => {
            item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
        });

        // Initialize the filter function and set the "Kaikki" category as active by default
        mygalleryfilterf2();
        const allFilterElement = filtersContainer.querySelector('[data-filter="all"]');
        if (allFilterElement) {
            allFilterElement.classList.add('active');
        }

        // Populate the categories in the navigation menu
        populateCategories(sortedCategories);
    }

    function createModal(item, index) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = `Modal${index}`;
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', `ModalLabel${index}`);
        modal.setAttribute('aria-hidden', 'true');

        const modalDialog = document.createElement('div');
        modalDialog.className = 'modal-dialog modal-dialog-centered';
        modalDialog.setAttribute('role', 'document');

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';

        const modalTitle = document.createElement('h2');
        modalTitle.className = 'modal-title text-center';
        modalTitle.id = `ModalLabel${index}`;
        modalTitle.textContent = item.acf.title; // Set the modal title to the book title

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'close';
        closeButton.setAttribute('data-bs-dismiss', 'modal');
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.innerHTML = 'x'; // Ensure only one "×" symbol

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);

        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';

        const containerFluid = document.createElement('div');
        containerFluid.className = 'container-fluid';

        const row = document.createElement('div');
        row.className = 'row';

        const colImg = document.createElement('div');
        colImg.className = 'col-12 col-md-6';

        const modalImg = document.createElement('img');
        modalImg.className = 'modalimg animate__animated animate animate__pulse animate__slow';
        modalImg.src = item.acf.cover
            ? `${item.acf.cover}`
            : `https://helle.finna.fi/Cover/Show?source=Solr&size=large&recordid=${item.acf.id}`;
        modalImg.alt = item.acf.title;

        colImg.appendChild(modalImg);

        const colText = document.createElement('div');
        colText.className = 'col-12 col-md-6 text-left';

        const titleInBody = document.createElement('h3');
        titleInBody.textContent = item.acf.title; // Keep the title in the body

        const modalText = document.createElement('p');
        modalText.innerHTML = item.acf.description.replace(/\n/g, '<br>') || '';

        colText.appendChild(titleInBody);

        if (item.acf.author) {
            const author = document.createElement('p');
            author.textContent = `Author: ${item.acf.author}`;
            author.style.fontWeight = 'bold';
            colText.appendChild(author);
            colText.appendChild(document.createElement('br'));
        }

        colText.appendChild(modalText);

        // Create a row for the "Varaa" and "Sulje" buttons directly under the description text
        const buttonRow = document.createElement('div');
        buttonRow.className = 'row mt-3';

        const buttonCol = document.createElement('div');
        buttonCol.className = 'col-12 text-center';

        const infoLink = document.createElement('a');
        infoLink.className = 'info me-2';
        infoLink.href = `https://helle.finna.fi/Record/${item.acf.id}`;
        infoLink.target = '_blank';

        const infoButton = document.createElement('button');
        infoButton.type = 'button';
        infoButton.className = 'btn btn-primary modalover myanimate';
        infoButton.textContent = 'Varaa';

        infoLink.appendChild(infoButton);
        buttonCol.appendChild(infoLink);

        const closeModalButton = document.createElement('button');
        closeModalButton.type = 'button';
        closeModalButton.className = 'btn btn-secondary';
        closeModalButton.setAttribute('data-bs-dismiss', 'modal');
        closeModalButton.textContent = 'Sulje';

        buttonCol.appendChild(closeModalButton);
        buttonRow.appendChild(buttonCol);
        colText.appendChild(buttonRow);

        row.appendChild(colImg);
        row.appendChild(colText);
        modalBody.appendChild(document.createElement('br'));

        containerFluid.appendChild(row);
        modalBody.appendChild(containerFluid);

        // Create a new row for the series books with a header after the buttons
        if (item.acf.serieid) {
            const seriesHeader = document.createElement('h4');
            seriesHeader.textContent = 'Sarjan kaikki osat';
            seriesHeader.className = 'text-center mt-4 mb-3';

            const seriesRow = document.createElement('div');
            seriesRow.className = 'row mt-3';

            fetchSeriesData(item.acf.serieid, seriesRow);

            modalBody.appendChild(seriesHeader);
            modalBody.appendChild(seriesRow);
        }

        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);

        modalDialog.appendChild(modalContent);
        modal.appendChild(modalDialog);

        document.body.appendChild(modal);
    }

    async function fetchSeriesData(serieId, container) {
        try {
            const seriesApiUrl = `https://api.finna.fi/api/v1/list?id=${serieId}`;
            const seriesResponse = await fetch(seriesApiUrl);
            if (!seriesResponse.ok) throw new Error('Network response was not ok');
            const seriesData = await seriesResponse.json();

            seriesData.records.forEach(record => {
                const book = record.record;
                const col = document.createElement('div');
                col.className = 'col-3 col-md-2 mb-2'; // Smaller columns for gallery view

                const link = document.createElement('a');
                link.href = `https://helle.finna.fi/Record/${book.id}`;
                link.target = '_blank';

                const coverImagePath = book.images && book.images.length > 0 ? book.images[0] : null;
                const coverImageUrl = coverImagePath
                    ? `https://api.finna.fi${coverImagePath}`
                    : `https://helle.finna.fi/Cover/Show?recordid=${book.id}`;

                const img = document.createElement('img');
                img.src = coverImageUrl;
                img.alt = book.title;
                img.className = 'img-fluid series-img';
                img.style.width = '100%';
                img.style.height = 'auto';

                // Add an error event listener to handle fallback image
                img.addEventListener('error', () => {
                    img.src = 'https://via.placeholder.com/150'; // Fallback image
                });

                link.appendChild(img);
                col.appendChild(link);
                container.appendChild(col);
            });
        } catch (error) {
            console.error('Error fetching the series data:', error);
        }
    }

    // Event listener for library selection change
    document.getElementById('mySelect').addEventListener('change', function() {
        const selectedLibrary = this.value;
        const selectedGrade = document.querySelector('.lukumain-nav .activenav').getAttribute('data-grade');
        fadeOutAndFetchBookData(selectedLibrary, selectedGrade);
    });

    // Event listener for grade selection change
    document.querySelectorAll('.lukumain-nav a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            document.querySelector('.lukumain-nav .activenav').classList.remove('activenav');
            this.classList.add('activenav');
            const selectedLibrary = document.getElementById('mySelect').value;
            const selectedGrade = this.getAttribute('data-grade');
            fadeOutAndFetchBookData(selectedLibrary, selectedGrade);
        });
    });

    // Close the category overlay and update books when a category is clicked
   document.querySelectorAll('.gallery-filter2 .filter-item2').forEach(item => {
    item.addEventListener('click', function(event) {
        event.preventDefault();
        closeNav(); // Close the overlay
        const selectedCategory = this.getAttribute('data-filter');
        const selectedLibrary = document.getElementById('mySelect').value;
        const selectedGrade = document.querySelector('.lukumain-nav .activenav').getAttribute('data-grade');
        filterBookData(selectedLibrary, selectedGrade, selectedCategory);
        // Update the category link text
        const categoryLink = document.querySelector('#openNav');
        const categoryText = this.textContent;
        categoryLink.textContent = `${categoryText} ☰`;
        // Scroll to top after a delay
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1000); // Longer delay to ensure UI is ready
    });
});



    // Call the function to populate the library list
    populateLibraryList();

    // Filter function
    function mygalleryfilterf2() {
        const filterContainer = document.querySelector(".gallery-filter");
        const galleryItems = document.querySelectorAll(".gallery-item");

        filterContainer.addEventListener("click", (event) => {
            if (event.target.classList.contains("filter-item2")) {
                // Deactivate existing active 'filter-item'
                const activeFilter = filterContainer.querySelector(".active");
                if (activeFilter) {
                    activeFilter.classList.remove("active");
                }
                // Activate new 'filter-item'
                event.target.classList.add("active");
                const filterValue = event.target.getAttribute("data-filter");
                mixer.filter(filterValue);
            }
            window.scrollTo(0, 0);
        });
    }

 function populateCategories(categories) {
    const navContainer = document.getElementById('categoryNav');
    navContainer.innerHTML = '';
    categories.forEach(category => {
        const navItem = document.createElement('a');
        navItem.innerHTML = `<span class="filter-item2 closeMe" data-filter="${sanitizeCategory(category)}">${category}</span>`;
        navItem.addEventListener('click', function(event) {
            event.preventDefault();
            closeNav(); // Close the category overlay
            const selectedLibrary = document.getElementById('mySelect').value;
            const selectedGrade = document.querySelector('.lukumain-nav .activenav').getAttribute('data-grade');
            filterBookData(selectedLibrary, selectedGrade, sanitizeCategory(category));
            // Update the category link text
            const categoryLink = document.querySelector('#openNav');
            categoryLink.textContent = `${category} ☰`;
            // Scroll to top after a delay
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 1000); // Longer delay to ensure UI is ready
        });
        navContainer.appendChild(navItem);
    });
    // Add "All" category as the last filter
    const allNavItem = document.createElement('a');
    allNavItem.innerHTML = `<span class="filter-item2 closeMe active" data-filter="all">Kaikki</span>`;
    allNavItem.addEventListener('click', function(event) {
        event.preventDefault();
        closeNav(); // Close the category overlay
        const selectedLibrary = document.getElementById('mySelect').value;
        const selectedGrade = document.querySelector('.lukumain-nav .activenav').getAttribute('data-grade');
        filterBookData(selectedLibrary, selectedGrade, 'all');
        // Update the category link text
        const categoryLink = document.querySelector('#openNav');
        categoryLink.textContent = `Kaikki ☰`;
        // Scroll to top after a delay
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1000); // Longer delay to ensure UI is ready
    });
    navContainer.appendChild(allNavItem);
}

});

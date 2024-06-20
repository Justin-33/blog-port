$(document).ready(function() {
    // Function to lazy load content when it comes into view
    function lazyLoadContent(entries, observer) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                // Lazy load background image
                lazyLoadBackground(entry.target);
                // Lazy load title and subtitle
                lazyLoadText(entry.target);
                // Lazy load content paragraphs
                lazyLoadParagraphs(entry.target);

                // Unobserve the entry after loading content
                observer.unobserve(entry.target);
            }
        });
    }

    // Lazy load background image
    function lazyLoadBackground(target) {
        const $backgroundCover = $(target).find('.background-cover');
        const imageUrl = $backgroundCover.attr('data-imageurl');
        if (imageUrl) {
            $backgroundCover.css('background-image', `url(${imageUrl})`);
        }
    }

    // Lazy load title and subtitle
    function lazyLoadText(target) {
        const $title = $(target).find('.post-intro h1');
        const $subtitle = $(target).find('.post-intro h3');
        const title = $title.attr('data-title');
        const subtitle = $subtitle.attr('data-subtitle');
        if (title) {
            $title.text(title);
        }
        if (subtitle) {
            $subtitle.text(subtitle);
        }
    }

    // Lazy load content paragraphs
    function lazyLoadParagraphs(target) {
        const $content = $(target).find('.content-container p');
        const contentHtml = $content.attr('data-content');
        if (contentHtml) {
            $content.html(contentHtml);
        }
    }

    // Set up Intersection Observer
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const observer = new IntersectionObserver(lazyLoadContent, options);

    // Observe all elements with the class .blog-section
    $('.blog-section').each(function() {
        observer.observe(this);
    });
});

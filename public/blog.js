$(document).load(function() {

    $(".content-section h3").textillate({
        loop: true,
        in: {
            effect:"fadeInLeftBig",
            delayScale:3,
            delay:20
        },
        out: {
            effect: "fadeOut"
        }
    })
})
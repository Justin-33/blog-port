// $(document).ready(function() {
// var images = ['pictures/dark.jpeg','pictures/DACK.jpeg', 'pictures/ai.png', 'pictures/pLANT.jpeg']; // Array of image URLs
//     var currentIndex = 0; // Index of the current image
//
//     function changeBackground() {
//         $(".jumbotron").fadeOut(1000 ,function(){
//             currentIndex = (currentIndex + 1) % images.length;
//             $(".jumbotron").css('background-image', 'url(' + images[currentIndex] + ')').fadeIn(1000)
//
//         })
//
//     }
//     setInterval(changeBackground, 10000)

$(document).ready(function() {

    $(".container h1").textillate({
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

//     $(document).ready(function() {


(function ($) {
"use strict";

// One Page Nav
var top_offset = $('.header-area').height() - 100;
$('.main-menu nav ul').onePageNav({
	currentClass: 'active',
	scrollOffset: top_offset,
});

// sticky
$(window).on('scroll', function () {
	var scroll = $(window).scrollTop();
	if (scroll < 200) {
		$("#header-sticky").removeClass("sticky-menu");
	} else {
		$("#header-sticky").addClass("sticky-menu");
	}
});

// Responsive Menu
$('.responsive').on('click', function (e) {
	$('#mobile-menu').slideToggle();
});

// menu toggle
$(".main-menu li a").on('click', function () {
	if ($(window).width() < 1200) {
		$("#mobile-menu").slideUp();
	}
});

// Parallaxmouse js
function parallaxMouse() {
	if ($('#parallax').length) {
		var scene = document.getElementById('parallax');
		var parallax = new Parallax(scene);
	};
};
parallaxMouse();

// scrollToTop
$.scrollUp({
	scrollName: 'scrollUp',
	topDistance: '300',
	topSpeed: 300,
	animation: 'fade',
	animationInSpeed: 200,
	animationOutSpeed: 200,
	scrollText: '<i class="fas fa-level-up-alt"></i>',
	activeOverlay: false,
});

// swiper
var swiper = new Swiper('.swiper-container', {
  effect: 'coverflow',
  grabCursor: true,
    loop: true,
  centeredSlides: true,
  slidesPerView: 'auto',
  coverflowEffect: {
      rotate: 0,
    stretch: 20,
    depth: 150,
    modifier: 1.5,
    slideShadows: true,
  },
  pagination: {
    el: '.swiper-pagination',
  },
});

})(jQuery);
var myPromise = require('bluebird');

module.exports = {
    transferAmount: function (transferParams) {
        return new myPromise(function (resolve) {
            // complete promise with a timer to simulate async response
            //setTimeout(function () {
                resolve("Transaction of "+transferParams.price.amount+" to "+transferParams.receiver+" completed");
            //}, 1000);
        });
    },

    searchHotelReviews: function (hotelName) {
        return new myPromise(function (resolve) {

            // Filling the review results manually just for demo purposes
            var reviews = [];
            for (var i = 0; i < 5; i++) {
                reviews.push({
                    title: ReviewsOptions[Math.floor(Math.random() * ReviewsOptions.length)],
                    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris odio magna, sodales vel ligula sit amet, vulputate vehicula velit. Nulla quis consectetur neque, sed commodo metus.',
                    image: 'https://upload.wikimedia.org/wikipedia/en/e/ee/Unknown-person.gif'
                });
            }

            // complete promise with a timer to simulate async response
            setTimeout(function () { resolve(reviews); }, 1000);
        });
    }
};
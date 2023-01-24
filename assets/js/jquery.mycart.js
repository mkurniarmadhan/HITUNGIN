(function ($) {
    "use strict";

    var OptionManager = (function () {
        var objToReturn = {};

        var _options = null;
        var DEFAULT_OPTIONS = {
            currencySymbol: "Rp",
            classCartIcon: "my-cart-icon",
            classCheckoutCart: "my-cart-checkout",
            affixCartIcon: true,
            showCheckoutModal: true,
            numberOfDecimals: 2,
            cartItems: null,
            clickOnAddToCart: function ($addTocart) {},
            afterAddOnCart: function (products, totalPrice, totalQuantity) {},
            clickOnCartIcon: function ($cartIcon, products, totalPrice, totalQuantity) {},
            checkoutCart: function (products, totalPrice, totalQuantity) {
                return false;
            },
            getDiscountPrice: function (products, totalPrice, totalQuantity) {
                return null;
            }
        };

        var loadOptions = function (customOptions) {
            _options = $.extend({}, DEFAULT_OPTIONS);
            if (typeof customOptions === "object") {
                $.extend(_options, customOptions);
            }
        };
        var getOptions = function () {
            return _options;
        };

        objToReturn.loadOptions = loadOptions;
        objToReturn.getOptions = getOptions;
        return objToReturn;
    })();

    var MathHelper = (function () {
        var objToReturn = {};
        var getRoundedNumber = function (number) {
            if (isNaN(number)) {
                throw new Error("Parameter is not a Number");
            }
            number = number * 1;
            var options = OptionManager.getOptions();
            return number.toFixed(options.numberOfDecimals);
        };
        objToReturn.getRoundedNumber = getRoundedNumber;
        return objToReturn;
    })();

    var ProductManager = (function () {
        var objToReturn = {};

        /*
      PRIVATE
      */
        const STORAGE_NAME = "__mycart";
        localStorage[STORAGE_NAME] = localStorage[STORAGE_NAME] ? localStorage[STORAGE_NAME] : "";
        var getIndexOfProduct = function (id) {
            var productIndex = -1;
            var products = getAllProducts();
            $.each(products, function (index, value) {
                if (value.id == id) {
                    productIndex = index;
                    return;
                }
            });
            return productIndex;
        };
        var setAllProducts = function (products) {
            localStorage[STORAGE_NAME] = JSON.stringify(products);
        };
        var addProduct = function (id, name, summary, price, quantity, image) {
            var products = getAllProducts();
            products.push({
                id: id,
                name: name,
                summary: summary,
                price: price,
                quantity: quantity,
                image: image
            });
            setAllProducts(products);
        };

        /*
      PUBLIC
      */
        var getAllProducts = function () {
            try {
                var products = JSON.parse(localStorage[STORAGE_NAME]);
                return products;
            } catch (e) {
                return [];
            }
        };
        var updatePoduct = function (id, quantity, increaseQuantity) {
            var productIndex = getIndexOfProduct(id);
            if (productIndex < 0) {
                return false;
            }
            var products = getAllProducts();
            if (increaseQuantity) {
                products[productIndex].quantity = products[productIndex].quantity * 1 + (typeof quantity === "undefined" ? 1 : quantity * 1);
            } else {
                products[productIndex].quantity = typeof quantity === "undefined" ? products[productIndex].quantity * 1 + 1 : quantity * 1;
            }
            setAllProducts(products);
            return true;
        };
        var setProduct = function (id, name, summary, price, quantity, image) {
            if (typeof id === "undefined") {
                console.error("id required");
                return false;
            }
            if (typeof name === "undefined") {
                console.error("name required");
                return false;
            }
            if (typeof image === "undefined") {
                console.error("image required");
                return false;
            }
            if (!$.isNumeric(price)) {
                console.error("price is not a number");
                return false;
            }
            if (!$.isNumeric(quantity)) {
                console.error("quantity is not a number");
                return false;
            }
            summary = typeof summary === "undefined" ? "" : summary;

            if (!updatePoduct(id, quantity, true)) {
                addProduct(id, name, summary, price, quantity, image);
            }
        };
        // var clearProduct = function () {
        //     setAllProducts([]);
        // };
        var getTotalQuantity = function () {
            var total = 0;
            var products = getAllProducts();
            $.each(products, function (index, value) {
                total += value.quantity * 1;
            });
            return total;
        };
        var getTotalPrice = function () {
            var products = getAllProducts();
            var total = 0;
            $.each(products, function (index, value) {
                total += value.quantity * value.price;
                total = MathHelper.getRoundedNumber(total) * 1;
            });
            return total;
        };

        objToReturn.getAllProducts = getAllProducts;
        objToReturn.updatePoduct = updatePoduct;
        objToReturn.setProduct = setProduct;
        // objToReturn.clearProduct = clearProduct;
        objToReturn.getTotalQuantity = getTotalQuantity;
        objToReturn.getTotalPrice = getTotalPrice;
        return objToReturn;
    })();

    var loadMyCartEvent = function (targetSelector) {
        var options = OptionManager.getOptions();
        var $cartIcon = $("." + options.classCartIcon);
        var $cartBadge = $("." + options.classCartBadge);
        var classProductQuantity = options.classProductQuantity;
        var idCartModal = "my-cart-modal";

        if (options.cartItems && options.cartItems.constructor === Array) {
            // ProductManager.clearProduct();
            $.each(options.cartItems, function () {
                ProductManager.setProduct(this.id, this.name, this.summary, this.price, this.quantity, this.image);
            });
        }

        $cartBadge.text(ProductManager.getTotalQuantity());

        var updateCart = function () {
            $.each($("." + classProductQuantity), function () {
                var id = $(this).closest("li").data("id");
                ProductManager.updatePoduct(id, $(this).val());
            });
        };

        $cartIcon.click(function () {
            updateCart();
            var isCheckedOut = options.checkoutCart(ProductManager.getAllProducts(), ProductManager.getTotalPrice(), ProductManager.getTotalQuantity());
            if (isCheckedOut !== false) {
                // ProductManager.clearProduct();
                $cartBadge.text(ProductManager.getTotalQuantity());
                $("#" + idCartModal).modal("hide");
            }
        });

        $(document).on("click", targetSelector, function () {
            var $target = $(this);
            options.clickOnAddToCart($target);

            var id = $target.data("id");
            var name = $target.data("name");
            var summary = $target.data("summary");
            var price = $target.data("price");
            var quantity = $target.data("quantity");
            var image = $target.data("image");

            ProductManager.setProduct(id, name, summary, price, quantity, image);
            $cartBadge.text(ProductManager.getTotalQuantity());

            options.afterAddOnCart(ProductManager.getAllProducts(), ProductManager.getTotalPrice(), ProductManager.getTotalQuantity());
        });
    };

    $.fn.myCart = function (userOptions) {
        OptionManager.loadOptions(userOptions);
        loadMyCartEvent(this.selector);
        return this;
    };
})(jQuery);

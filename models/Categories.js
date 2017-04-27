const mongoose = require('mongoose');

let categorySchema = mongoose.Schema({
    categoryNumber: {type: String},
    bulgarian: {type: String},
    english: {type: String}
});

const Categories = mongoose.model('Categories', categorySchema);

module.exports = Categories;

module.exports.initialize = () => {
    let vehicles = 'Vehicles and parts';
    let bgVehicles = 'Коли и части';
    let vehiclesNumber = '1';
    findCategory(vehicles, bgVehicles, vehiclesNumber);

    let houses = 'Real Estate';
    let bgHouses = 'Недвижими имоти';
    let housesNumber = '2';
    findCategory(houses, bgHouses, housesNumber);

    let clothes = 'Clothes';
    let bgClothes = 'Дрехи';
    let clothesNumber = '3';
    findCategory(clothes, bgClothes, clothesNumber);

    let electronics = 'Electronics';
    let bgElectronics = 'Електроника';
    let electronicsNumber = '4';
    findCategory(electronics, bgElectronics, electronicsNumber);

    let homeAndHobby = 'Home and Hobby';
    let bgHomeAndHobby = 'Дом и хоби';
    let homeAndHobbyNumber = '5';
    findCategory(homeAndHobby, bgHomeAndHobby, homeAndHobbyNumber);

    let jewelry = 'Jewelry';
    let bgJewelry = 'Бижута';
    let jewelryNumber = '6';
    findCategory(jewelry, bgJewelry, jewelryNumber);

    function findCategory (category, bgCategory, number) {
        Categories.findOne({english: category}).then(currCategory => {
            if (!currCategory) {
                Categories.create({categoryNumber: number, english: category, bulgarian: bgCategory});
            }
        });
    }
};
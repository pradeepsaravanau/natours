/*eslint-disable*/
import '@babel/polyfill';
import { displayMap } from './mapbox';
//we use {login} since we used like export const login in login file
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { signup } from './signup';
import { createReview } from './createReview';
import { confirmEmail } from './confirmEmail';
import { showAlert } from './alert';
//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const reviewForm = document.querySelector('.form--review');
const confirmEmailForm = document.querySelector('.form--verify-email');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');
//VALUES

//DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm)
  loginForm.addEventListener('submit', e => {
    //stop reload
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    e.preventDefault();
    login(email, password);
  });

//click = event , logout = function
if (logOutBtn) logOutBtn.addEventListener('click', logout);
if (userDataForm)
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    //programatically create multipart data
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    updateSettings(form, 'data');
  });
if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    document.querySelector('.btn--save--password').textContent = 'Updating....';
    //inorder to perform operation after this task we await in a async function
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );
    document.querySelector('.btn--save--password').textContent =
      'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn) {
  bookBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing';
    //dataset-tour-id tour-id is converted to tourId
    // const tourId = e.target.dataset.tourId;
    const dateId = document.getElementById('date').value;
    console.log(dateId);
    const { tourId } = e.target.dataset;
    bookTour(tourId, dateId);
    e.target.textContent = 'Book Tour Now';
  });
}
if (signupForm) {
  signupForm.addEventListener('submit', e => {
    e.preventDefault();
    document.getElementById('signup').textContent = 'Creating New Account...';
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    signup(name, email, password, passwordConfirm);
  });
}
if (reviewForm) {
  const Review = document.querySelector('.reviews__review');
  let rating = 0;
  Review.addEventListener('click', e => {
    if (e.target.closest('.review__star--big')) {
      rating = e.target.closest('.review__star--big').dataset.star;
      for (let i = 0; i < 5; i++) {
        if (rating > i) {
          if (e.target.closest('.reviews__rating')) {
            e.target
              .closest('.reviews__rating')
              .children[i].classList.remove('reviews__star--inactive');
            e.target
              .closest('.reviews__rating')
              .children[i].classList.add('reviews__star--active');
          }
        } else {
          e.target
            .closest('.reviews__rating')
            .children[i].classList.add('reviews__star--inactive');
          e.target
            .closest('.reviews__rating')
            .children[i].classList.remove('reviews__star--active');
        }
      }
    }
  });
  reviewForm.addEventListener('submit', async e => {
    e.preventDefault();
    const review = document.getElementById('description').value;
    const tour = document.querySelector('.tourId').dataset.id;
    await createReview({ tour, rating, review });
  });
}
if (confirmEmailForm) {
  confirmEmailForm.addEventListener('submit', e => {
    e.preventDefault();
    const confirmEmailToken = document.getElementById('token').value;
    const email = document.getElementById('email').placeholder;
    confirmEmail(confirmEmailToken, email);
  });
}
const alertMessage = document.querySelector('body').dataset.alert;
if (alert) showAlert('success', alertMessage, 20);

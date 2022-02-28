/* eslint-disable */
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  //In order to remove the element parentElement from child element
  //el.parentElementsed to go one level up and select the parent element and then from there select
  if (el) el.parentElement.removeChild(el);
};
//type is success or error
export const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  console.log(document.querySelector('body'));
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};

// Vendor Modules
import $ from 'jquery';
import _ from 'underscore';
import Trip from 'app/models/trip.js'
import Reservation from 'app/models/reservation.js'
import TripList from 'app/collections/tripList.js'

// CSS
import './css/foundation.css';
import './css/style.css';

console.log('it loaded!');

const tripList = new TripList();

const TRIP_FIELDS = [ 'id', 'name', 'continent', 'category', 'weeks','cost', 'about']

const TABLE_HEADERS = [ 'name', 'continent', 'category', 'weeks','cost']

const RESERVATION_FIELDS = [ 'tripID', 'name', 'age', 'email']

//************************** Render ***************
//I should not have done all the fetching in one step.  If I were to
// go back and fix this, I would only render the "about" details if
// a click event happened on that row.  I would get the id for the
// fetch either by hanging it off the html somewhere (the less-good choice)
// or figure out what Dan was talking about when he described making a closure
// within the tripList.forEach loop that would make an event handler for each row.
const render = function render(tripList) {
  $('#trip-list').html('')
  console.log(tripList);
  tripList.forEach((trip) => {
    let currentTrip = new Trip({id: trip.id});
    currentTrip.fetch().done(function() {
      console.log(currentTrip.attributes);
      const tripTemplate =  _.template($('#trip-template').html());
      const tripHTML = tripTemplate(currentTrip.attributes);

      $('#trip-list').append(tripHTML);
      let id = currentTrip.get('id')
      console.log(`.current-trip-${id}`);

      $('th.sort').removeClass('current-sort-field');
      $(`th.sort.${ tripList.comparator }`).addClass('current-sort-field');
    });
  });
};

//*************METHODS TO MAKE FORMS POP UP AND LEAVE AND UPDATE***************
// toggles trip about information
const tripDetailHandler = function (event){
  console.log(event.target.parentElement.id);
  let id = event.target.parentElement.id;
  $(`.details-${id}`).toggleClass('hide');
  $(`.button-${id}`).toggleClass('hide');
}

const modalOpener= function modalOpener() {
  // console.log(event)
  console.log('opening modal')
  $('.modal').removeClass('hide');
  $('#close').on('click', modalCloser)
}

const modalCloser= function modalCloser() {
  // console.log(event)
  console.log('closing modal')
  $('.modal').addClass('hide');
}

// shows the reservation form and updates trip name
const reserveFormUpdate = function (event){
  console.log(event.target.parentElement.className);
  let id = event.target.parentElement.className

  let currentTrip = new Trip({id: id});
  currentTrip.fetch().done(function() {
    const formTemplate =  _.template($('#form-template').html());
    console.log(formTemplate);
    const formHTML = formTemplate(currentTrip.attributes);
    $('#form-container').html(formHTML);
    $('#reserve-form').on('click','.submit-reservation', addReservationHandler);
  });
}

//**************************ADDING TRIPS AND RESERVATIONS ***************
const addTripHandler = function(event){
  event.preventDefault();
  $('.trip-status-messages').html('<p> </p>')
  const trip = new Trip(readTripFormData());

  if (!trip.isValid()) {
    handleValidationFailuresTrip(trip.validationError);
    return;
  }
  console.log('I am getting ready to make a trip.')
  console.log(trip.attributes)
  tripList.add(trip);
  trip.save({}, {
    success: (model, response) => {
      console.log('Successfully saved trip!');
      // reportNewTripStatus('success', 'Successfully saved trip!');
      $('.modal').addClass('hide');
      $('.trip-success-messages').append('Successfully saved trip!');
      $('.trip-success-messages').show();
    },
    error: (model, response) => {
      console.log('Failed to save trip! Server response:');
      console.log(response);
      tripList.remove(model);

      handleValidationFailuresTrip(response.responseJSON["errors"]);
    },
  });
};

const addReservationHandler = function addReservationHandler(event) {
  event.preventDefault();
  $('.reservation-status-messages').html('<p> </p>')
  const reservation = new Reservation(readReservationFormData());

  if (!reservation.isValid()) {
    handleValidationFailuresReservation(reservation.validationError);
    return;
  }
  console.log('I am getting ready to reserve a trip!')
  console.log(reservation.attributes)

  reservation.save({}, {
    success: (model, response) => {
      console.log('Successfully saved trip!');
      reportNewReservationStatus('success', 'Successfully saved reservation!');
      $('#reserve-form').addClass('hide')
      $
    },
    error: (model, response) => {
      console.log('Failed to save reservation! Server response:');
      console.log(response);
      // tripList.remove(model); <--what should I do here?

      handleValidationFailuresReservation(response.responseJSON["errors"]);
    },
  });
};



//**************************ValidationFailures ***************
//Having two nearly identical funtions to handle errors is a poor
//solution to the problem of errors being appended to the wrong
// form. It would be better to find a way to pass some parameter
// into these functions to tell it where to place the errors.
const handleValidationFailuresTrip = function handleValidationFailures(errors) {
  for (let field in errors) {
    for (let problem of errors[field]) {
      reportNewTripStatus('error', `${field}: ${problem}`);
    }
  }
};

const handleValidationFailuresReservation = function handleValidationFailures(errors) {
  for (let field in errors) {
    for (let problem of errors[field]) {
      reportNewReservationStatus('error', `${field}: ${problem}`);
    }
  }
};

//**************************Report Status ***************
// Similarly to the ValidationFailures... this is not a good way
// to solve the problem.
const reportNewTripStatus = function reportNewTripStatus(status, message) {
  console.log(`Reporting ${ status } status: ${ message }`);
  // Should probably use an Underscore template here.
  const statusHTML = ` <p class="${ status }">${ message }</p>`;
  $('.trip-status-messages').append(statusHTML);
  $('.trip-status-messages').show();
};

const reportNewReservationStatus = function reportNewReservationStatus(status, message) {
  console.log(`Reporting ${ status } status: ${ message }`);
  // Should probably use an Underscore template here.
  const statusHTML = ` <p class="${ status }">${ message }</p>`;
  $('.reservation-status-messages').append(statusHTML);
  $('.reservation-status-messages').show();
};


//**************************READ FORMS ***************
//seems like these could be just one, more cleverly written,
// function.
const readTripFormData = function readTripFormData() {
  const tripData = {};
  TRIP_FIELDS.forEach((field) => {
    // select the input corresponding to the field we want
    const inputElement = $(`#add-trip-form input[name="${ field }"]`);
    const value = inputElement.val();

    if (value != '') {
      tripData[field] = value;
    }
    inputElement.val('');
  });
  console.log("Read trip data");
  console.log(tripData.attributes);
  return tripData;
};

const readReservationFormData = function readReservationFormData() {
  console.log('getting ready to read reservation form')
  const reservationData = {};
  RESERVATION_FIELDS.forEach((field) => {
    // select the input corresponding to the field we want
    const inputElement = $(`#reserve-form input[name="${ field }"]`);
    const value = inputElement.val();

    if (value != '') {
      reservationData[field] = value;
    }
  });
  console.log("Read reservation data");
  console.log(reservationData.attributes);
  return reservationData;
};

//***********************start of Filter Function  ***************
//the next step is to connect this to a filter function in the tripList
//collection.  Also, to modify render so that it updates the filter parameters
// before rendering the tripList.  Make it so the default is no paramaters
const filterHandler = function filterHandler(event) {
  console.log(document.getElementById('exampleList').value);
  console.log(document.getElementById('textbox').value);
}


//**************************DOC.READY ***************

$(document).ready( () => {
  tripList.fetch().done(function() {
    console.log('done');
    render(tripList);
    let currentTrip = new Trip();
  });

  tripList.on('sort', render);

  $('#trip-list').on('click', 'button', tripDetailHandler);
  $('#trip-list').on('click', '.reserve', reserveFormUpdate);
  $('#add-trip-form').on('submit', addTripHandler);

  $('#modalBtn').on('click', modalOpener);
  $('#textbox').keyup(filterHandler);


  TABLE_HEADERS.forEach((field) => {
    const headerElement = $(`th.sort.${ field }`);
    headerElement.on('click', (event) => {
      console.log(`Sorting table by ${ field }`);
      tripList.comparator = field;
      tripList.sort();
    });
  });
});

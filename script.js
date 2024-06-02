document.addEventListener('DOMContentLoaded', () => {
    /**
     * Class representing an event.
     */
    class Event {
        /**
         * Create an event.
         * @param {string} title - The title of the event.
         * @param {string} day - The day of the event.
         * @param {string} start - The start time of the event.
         * @param {string} end - The end time of the event.
         * @param {string} type - The type of the event.
         */
        constructor(title, day, start, end, type) {
            this.title = title;
            this.day = day;
            this.start = start;
            this.end = end;
            this.type = type;
        }

        /**
         * Save the event to localStorage.
         */
        save() {
            const eventKey = `event-${this.day}-${this.start}`;
            localStorage.setItem(eventKey, JSON.stringify(this));
        }

        /**
         * Delete the event from localStorage.
         * @param {string} eventKey - The key of the event to delete.
         */
        static delete(eventKey) {
            localStorage.removeItem(eventKey);
        }

        /**
         * Load all events from localStorage.
         * @return {Event[]} Array of events.
         */
        static loadAll() {
            const events = [];
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('event-')) {
                    const eventDetails = JSON.parse(localStorage.getItem(key));
                    events.push(new Event(eventDetails.title, eventDetails.day, eventDetails.start, eventDetails.end, eventDetails.type));
                }
            });
            return events;
        }
    }

    /**
     * Class representing a calendar.
     */
    class Calendar {
        /**
         * Create a calendar.
         */
        constructor() {
            this.firstDayDate = new Date();
            if (this.firstDayDate.getDay() === 0) { // Sunday
                this.firstDayDate.setDate(this.firstDayDate.getDate() - 6);
            } else {
                this.firstDayDate.setDate(this.firstDayDate.getDate() - this.firstDayDate.getDay() + 1);
            }
            this.firstDayDate.setHours(0, 0, 0, 0);
            this.currDate = new Date();
            this.dayDate = new Date(this.firstDayDate);
            this.initialize();
            this.addEventListeners();
        }

        /**
         * Initialize the calendar by filling hours and loading events.
         */
        initialize() {
            this.fillHours();
            this.loadEvents();
        }

        /**
         * Fill the hours for a specific day.
         * @param {string} id - The ID of the day column.
         * @param {string} day - The name of the day.
         */
        fillDayHours(id, day) {
            let header = `<div class="day-header`;
            if (this.dayDate.toLocaleDateString() === this.currDate.toLocaleDateString()) {
                header += "-current";
            }
            header += `">${day} ${this.dayDate.toLocaleDateString()}</div>`;
            for (let i = 0; i < 16; i++) {
                header += `<div class="hour-cal"></div>`;
            }
            document.getElementById(id).innerHTML = header;
            this.dayDate.setDate(this.dayDate.getDate() + 1);
        }

        /**
         * Fill the hours for all days of the week.
         */
        fillHours() {
            this.dayDate = new Date(this.firstDayDate);
            this.fillDayHours("dow1", "Monday");
            this.fillDayHours("dow2", "Tuesday");
            this.fillDayHours("dow3", "Wednesday");
            this.fillDayHours("dow4", "Thursday");
            this.fillDayHours("dow5", "Friday");
            this.fillDayHours("dow6", "Saturday");
            this.fillDayHours("dow0", "Sunday");
        }

        /**
         * Load events from localStorage and add them to the calendar.
         */
        loadEvents() {
            const events = Event.loadAll();
            events.forEach(event => this.addEventToCalendar(event));
        }

        /**
         * Add an event to the calendar.
         * @param {Event} eventDetails - The details of the event.
         */
        addEventToCalendar(eventDetails) {
            let dtEvent = new Date(eventDetails.day);
            if (dtEvent.getTime() < this.firstDayDate.getTime() || dtEvent.getTime() > this.firstDayDate.getTime() + 7 * 24 * 3600 * 1000) {
                return;
            }
            const dayColumn = document.getElementById("dow" + dtEvent.getDay());
            if (dayColumn) {
                const dayHeaderHeight = dayColumn.firstChild.clientHeight;
                const start = dayHeaderHeight + this.parseTime(eventDetails.start) + 2;
                const end = dayHeaderHeight + this.parseTime(eventDetails.end) - 2;
                const duration = end - start;

                const eventElement = document.createElement('div');
                eventElement.setAttribute("eventKey", `event-${eventDetails.day}-${eventDetails.start}`)
                eventElement.classList.add('event');
                eventElement.textContent = `${eventDetails.type} - ${eventDetails.title} (${eventDetails.start} - ${eventDetails.end})`;
                eventElement.style.top = `${start}px`;
                eventElement.style.height = `${duration - 2}px`;
                eventElement.setAttribute('draggable', 'true');
                eventElement.dataset.eventKey = `event-${eventDetails.day}-${eventDetails.start}`;
                eventElement.addEventListener('dragstart', this.handleDragStart.bind(this));
                eventElement.addEventListener('dragend', this.handleDragEnd.bind(this));
                dayColumn.appendChild(eventElement);
            }
        }

        /**
         * Parse a time string into minutes.
         * @param {string} timeStr - The time string to parse.
         * @return {number} The number of minutes from 6:00 AM.
         */
        parseTime(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return ((hours - 6) * 60) + minutes;
        }

        /**
         * Handle the start of dragging an event.
         * @param {DragEvent} e - The drag event.
         */
        handleDragStart(e) {
            e.dataTransfer.setData('text/plain', e.target.dataset.eventKey);
        }

        /**
         * Handle the end of dragging an event.
         * @param {DragEvent} e - The drag event.
         */
        handleDragEnd(e) {
            const trashBinRect = document.getElementById('trash').getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            if (mouseX > trashBinRect.left &&
                mouseX < trashBinRect.right &&
                mouseY > trashBinRect.top &&
                mouseY < trashBinRect.bottom) {
                const confirmation = confirm("Do you really want to delete that?");
                if (confirmation) {
                    Event.delete(e.target.getAttribute("eventKey"));
                    e.target.remove();
                    this.playDeleteSound();
                }
            }
        }

        /**
         * Play delete sound effect.
         */
        playDeleteSound() {
            const deleteSound = document.getElementById('audio');
            deleteSound.play().then(r => {});
        }

        /**
         * Add event listeners to various elements.
         */
        addEventListeners() {
            document.getElementById('prevWeek').addEventListener('click', () => {
                this.firstDayDate.setDate(this.firstDayDate.getDate() - 7);
                this.initialize();
            });

            document.getElementById('nextWeek').addEventListener('click', () => {
                this.firstDayDate.setDate(this.firstDayDate.getDate() + 7);
                this.initialize();
            });

            const trashBin = document.getElementById('trash');
            trashBin.addEventListener('dragenter', function () {
                trashBin.src = 'open-bin.png';
                trashBin.classList.add('bin-open');
            });

            trashBin.addEventListener('dragleave', function () {
                trashBin.src = 'closed-bin.png';
                trashBin.classList.remove('bin-open');
            });

            document.getElementById('newEvent').addEventListener('click', () => {
                const eventWin = document.getElementById('eventForm');
                const eventButton = document.getElementById('newEvent');
                if (eventWin.style.display === 'none' || eventWin.style.display === '') {
                    eventWin.style.display = 'block';
                    eventButton.textContent = 'Close window'
                } else {
                    eventWin.style.display = 'none';
                    eventButton.textContent = 'New event'
                }
            });

            const smiley = document.getElementById('smiley');
            const mouth = smiley.querySelector('.mouth');

            smiley.addEventListener('mouseenter', () => {
                mouth.setAttribute('d', 'M20,40 Q32,50 44,40');
            });

            smiley.addEventListener('mouseleave', () => {
                mouth.setAttribute('d', 'M20,40 Q32,35 44,40');
            });
        }
    }

    /**
     * Class representing the event form.
     */
    class EventForm {
        /**
         * Create an event form.
         */
        constructor() {
            this.eventForm = document.getElementById('addEventForm');
            this.eventWin = document.getElementById('eventForm');
            this.eventTitle = document.getElementById('eventTitle');
            this.eventDay = document.getElementById('eventDay');
            this.eventStart = document.getElementById('eventStart');
            this.eventEnd = document.getElementById('eventEnd');
            this.eventType = document.getElementById('eventType');
            this.currDate = new Date();
            this.initForm();
        }

        /**
         * Initialize the event form.
         */
        initForm() {
            this.eventForm.addEventListener('submit', (event) => {
                this.handleSubmit(event);
            });
        }

        /**
         * Handle the submission of the event form.
         * @param {Event} event - The form submission event.
         */
        handleSubmit(event) {
            event.preventDefault();
            const startTime = this.eventStart.value;
            const endTime = this.eventEnd.value;

            if (startTime && endTime) {
                const start = new Date(`1970-01-01T${startTime}:00`);
                const end = new Date(`1970-01-01T${endTime}:00`);
                const difference = (end - start) / 60000; // difference in minutes

                if (difference < 15) {
                    alert('The end time must be at least 15 minutes after the start time.');
                } else {
                    const eventDetails = new Event(
                        this.eventTitle.value,
                        this.eventDay.value,
                        this.eventStart.value,
                        this.eventEnd.value,
                        this.eventType.value
                    );
                    eventDetails.save();
                    this.eventWin.style.display = 'none';
                    calendar.addEventToCalendar(eventDetails);
                    this.resetForm();
                }
            }
        }

        /**
         * Reset the event form fields.
         */
        resetForm() {
            this.eventTitle.value = '';
            this.eventDay.value = this.currDate.toDateString();
            this.eventStart.value = '';
            this.eventEnd.value = '';
            this.eventType.value = 'Massage';
        }
    }

// Instantiate the calendar and event form objects
    const calendar = new Calendar();
    const eventForm = new EventForm();
});
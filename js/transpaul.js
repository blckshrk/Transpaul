/*jslint browser:true*/
/*global transpole, vlille, Mustache, moment*/

(function () {
    'use strict';

    moment.locale('fr');

    var transpoleInstance = transpole();

    /**
     * Mustache formatter to apply specific class according to `remaining` value.
     * @return {Function} [description]
     */
    function remainingFormatter() {
        return function (text, render) {
            var remaining = parseInt(render(text), 10),
                remainingClass = 'transpole-remaining',
                remainingHuman;

            if (remaining <= 5) {
                remainingClass += ' transpaul-danger';
            } else if (remaining <= 10) {
                remainingClass += ' transpaul-warning';
            }

            remainingHuman = '<span class="transpole-remaining-number">' + remaining + '</span> ' + (remaining > 1 ? 'minutes' : 'minute');

            return '<span class="' + remainingClass + '">' + remainingHuman + '</span>';
        };
    }

    /**
     * Formats Transpole data for Mustache template.
     * @param  {Object} data [description]
     * @return {Object}      [description]
     */
    function formatTranspoleData(data) {
        var nexts = data.directions[0].nexts || [],
            nowMoment = moment(data.refDate);

        // Formats `next` value into HH:mm
        // Computes `remaining` value in minutes
        nexts = nexts.map(function (next) {
            var nextMoment = moment(next.next);

            return {
                next: nextMoment.format('HH:mm'),
                remaining: nextMoment.subtract(nowMoment).format('m')
            };
        });

        return {
            lineName: data.lineName,
            lineMode: data.lineMode.toLowerCase(),
            stopName: data.stopName,
            direction: data.directions[0].stopName,
            nexts: nexts,
            remainingFormatter: remainingFormatter
        };
    }

    /**
     * Updates DOM with Transpole data using Mustache template.
     * @param  {Object} data [description]
     */
    function handleTranspoleSuccess(data) {
        var element = document.getElementById('transpole-data'),
            template = document.getElementById('transpole.mst').innerHTML;

        if (!data.directions[0].nexts) {
            // END OF SERVICE
            element.innerHTML = '<div class="transpole-no-bus"><img src="assets/dawson-crying.jpg"><p>Tous les bus sont partis :\'-(</p></div>';

            return;
        }

        element.innerHTML = Mustache.render(template, formatTranspoleData(data));
    }

    function handlerVlilleSuccess(data) {
        var element = document.getElementById('vlille-data'),
            template = document.getElementById('vlille.mst').innerHTML;

        element.innerHTML = Mustache.render(template, data);
    }

    /**
     * @param  {Object} error [description]
     */
    function handleError(error) {
        console.error(error);
    }

    /**
     * APIs calls
     */

    transpoleInstance.getNext('18', '773', 'R').then(handleTranspoleSuccess, handleError);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            vlille.closestStations({
                lat: position.coords.latitude,
                lon: position.coords.longitude
            }).then(handlerVlilleSuccess, handleError);
        });
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}());
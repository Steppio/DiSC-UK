logSelectObserve = function () {
    var rl = $('rl-log-switcher');
    if (rl) {
        rl.observe('change', function (ev) {
            $('realex-log-view').src = rl.getValue();
        });
    }
}

loadActions = function () {
    logSelectObserve();
}

Event.observe(window, 'load', loadActions);

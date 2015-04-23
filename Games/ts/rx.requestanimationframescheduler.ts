/// <reference path="rx/rx.all.d.ts" />

/**
 * From RxJS-DOM
 * @see https://github.com/Reactive-Extensions/RxJS-DOM/blob/master/src/requestanimationframescheduler.js
 **/

declare module Rx {
     
	export interface SchedulerStatic {		
		requestAnimationFrame: Scheduler;
	}

}

module Rx {

	var Observable = Rx.Observable,
	    observerCreate = Rx.Observer.create,
	    disposableCreate = Rx.Disposable.create,
	    CompositeDisposable = Rx.CompositeDisposable,
	    SingleAssignmentDisposable = Rx.SingleAssignmentDisposable,
	    AsyncSubject = Rx.AsyncSubject,
	    Subject = Rx.Subject,
	    Scheduler = Rx.Scheduler,
	    defaultNow = (function () { return !!Date.now ? Date.now : function () { return +new Date; }; }());

(function(root){
  // Get the right animation frame method
  var requestAnimFrame, cancelAnimFrame;
  if (root.requestAnimationFrame) {
    requestAnimFrame = root.requestAnimationFrame;
    cancelAnimFrame = root.cancelAnimationFrame;
  } else if (root.mozRequestAnimationFrame) {
    requestAnimFrame = root.mozRequestAnimationFrame;
    cancelAnimFrame = root.mozCancelAnimationFrame;
  } else if (root.webkitRequestAnimationFrame) {
    requestAnimFrame = root.webkitRequestAnimationFrame;
    cancelAnimFrame = root.webkitCancelAnimationFrame;
  } else if (root.msRequestAnimationFrame) {
    requestAnimFrame = root.msRequestAnimationFrame;
    cancelAnimFrame = root.msCancelAnimationFrame;
  } else if (root.oRequestAnimationFrame) {
    requestAnimFrame = root.oRequestAnimationFrame;
    cancelAnimFrame = root.oCancelAnimationFrame;
  } else {
    requestAnimFrame = function(cb) { root.setTimeout(cb, 1000 / 60); };
    cancelAnimFrame = root.clearTimeout;
  }

  /**
   * Gets a scheduler that schedules schedules work on the requestAnimationFrame for immediate actions.
   */
  Rx.Scheduler.requestAnimationFrame = (function () {

    function scheduleNow(state, action) {
      var scheduler = this,
        disposable = new Rx.SingleAssignmentDisposable();
      var id = requestAnimFrame(function () {
        !disposable.isDisposed && (disposable.setDisposable(action(scheduler, state)));
      });
      return new CompositeDisposable(disposable, disposableCreate(function () {
        cancelAnimFrame(id);
      }));
    }

    function scheduleRelative(state, dueTime, action) {
      var scheduler = this,
        dt = Scheduler.normalize(dueTime);

      if (dt === 0) { return scheduler.scheduleWithState(state, action); }

      var disposable = new SingleAssignmentDisposable(),
          id;
      var scheduleFunc = function () {
        if (id) { cancelAnimFrame(id); }
        if (dt - scheduler.now() <= 0) {
          !disposable.isDisposed && (disposable.setDisposable(action(scheduler, state)));
        } else {
          id = requestAnimFrame(scheduleFunc);
        }
      };

      id = requestAnimFrame(scheduleFunc);

      return new CompositeDisposable(disposable, disposableCreate(function () {
        cancelAnimFrame(id);
      }));
    }

    function scheduleAbsolute(state, dueTime, action) {
      return this.scheduleWithRelativeAndState(state, dueTime - this.now(), action);
    }

    return new Scheduler(defaultNow, scheduleNow, scheduleRelative, scheduleAbsolute);

  }());
})(window);

}
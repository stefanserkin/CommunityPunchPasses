import { LightningElement, wire, track } from 'lwc';
import { CurrentPageReference } from "lightning/navigation";

export default class AppointmentScheduler extends LightningElement {
	cardTitle = 'Appointment Scheduler'
	@track displayText;

	@wire(CurrentPageReference)
	getStateParameters(currentPageReference) {
		if (currentPageReference) {
			const ctName = currentPageReference.state.c__ctName;
			const memId = currentPageReference.state.c__memId;
			if (ctName && memId) {
				this.displayText = `Schedule an appointment for ${ctName}'s package with id : ${memId}`;
			} else {
				this.displayText = `Membership was not passed`;
			}
		}
	}

}
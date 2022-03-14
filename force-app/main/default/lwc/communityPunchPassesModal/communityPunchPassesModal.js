import { LightningElement, api } from 'lwc';

export default class CommunityPunchPassesModal extends LightningElement {
	@api modalHeader;
    @api modalContent;
	
    showCancel = false;
    showOkay = true;

    handleCloseEvent() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleCancelEvent() {
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    handleOkayEvent() {
        this.dispatchEvent(new CustomEvent('okay'));
    }


}

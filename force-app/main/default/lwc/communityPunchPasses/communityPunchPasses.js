import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import getActivePunchPassesByContact from '@salesforce/apex/CommunityPunchPassesController.getActivePunchPassesByContact';
import getCompletedPunchPassesByContact from '@salesforce/apex/CommunityPunchPassesController.getCompletedPunchPassesByContact';

import USER_ID from '@salesforce/user/Id';
import CONTACTID_FIELD from '@salesforce/schema/User.ContactId';
import ACCOUNTID_FIELD from '@salesforce/schema/User.AccountId';
import ACCOUNTNAME_FIELD from '@salesforce/schema/User.Account.Name';

const COLS = [
    { label: 'Package', fieldName: 'TREX1__Type__c', type: 'text', hideDefaultActions: true },
    { label: 'Used', fieldName: 'TREX1__Total_Value__c', type: 'number', initialWidth: 144, hideDefaultActions: true,
		cellAttributes: { 
			alignment: 'left' 
		}
	},
    { label: 'Remaining', fieldName: 'TREX1__Remaining_Value__c', type: 'number', initialWidth: 144, hideDefaultActions: true,
		cellAttributes: { 
			alignment: 'left' 
		}
	},
	{ label: 'Expiration Date', fieldName: 'TREX1__End_Date__c', type: 'date', initialWidth: 144, hideDefaultActions: true, 
		typeAttributes:{
			year: "numeric",
			month: "long",
			day: "2-digit"
		}
	}
];

export default class CommunityPunchPasses extends LightningElement {
	isLoading = true;
	error;

	contactId;
	accountId;
	accountName;

	cols = COLS;
	contactsWithActivePunchPasses;
	wiredContactsWithActivePunchPasses = [];
	contactsWithCompletedPunchPasses;
	wiredContactsWithCompletedPunchPasses = [];

	noActivePunchPassesDescription = 'No Active Punch Passes';
	noCompletedPunchPassesDescription = 'No Completed Punch Passes';
	noActivePunchPassesDescriptionContact = 'This contact does not have any active punch pass memberships'
	noCompletedPunchPassesDescriptionContact = 'This contact does not have any completed punch pass memberships';

	numHouseholdActivePunchPasses = 0;
	numHouseholdCompletedPunchPasses = 0;

	get cardTitle() {
		return this.accountName != null ? 'Punch Passes for ' + this.accountName : 'Punch Passes';
	}

	get activePunchPassesSectionLabel() {
		return 'Active Punch Passes (' + this.numHouseholdActivePunchPasses + ')';
	}

	get completedPunchPassesSectionLabel() {
		return 'Completed Punch Passes (' + this.numHouseholdCompletedPunchPasses + ')';
	}

	get householdHasActivePunchPasses() {
		return this.numHouseholdActivePunchPasses > 0 ? true : false;
	}

	get householdHasCompletedPunchPasses() {
		return this.numHouseholdCompletedPunchPasses > 0 ? true : false;
	}

	@wire(getRecord, {
        recordId: USER_ID,
        fields: [CONTACTID_FIELD, ACCOUNTID_FIELD, ACCOUNTNAME_FIELD]
    }) wireuser({
        error,
        data
    }) {
        if (error) {
        	this.error = error; 
        } else if (data) {
            this.contactId = data.fields.ContactId.value;
			this.accountId = data.fields.AccountId.value;
			this.accountName = getFieldValue(data, ACCOUNTNAME_FIELD);
        }
    }

	@wire(getActivePunchPassesByContact, { accountId: '$accountId' })
    wiredActivePunchPasses(result) {
		this.wiredContactsWithActivePunchPasses = result;
	
        if (result.data) {
			let rows = JSON.parse( JSON.stringify(result.data) );
			for (let i = 0; i < rows.length; i++) {
                let dataParse = rows[i];
				dataParse.fullName = dataParse.FirstName + ' ' + dataParse.LastName;
				dataParse.numActivePunchPasses = dataParse.TREX1__Memberships__r.length;
				dataParse.sectionLabel = dataParse.fullName + ' (' + dataParse.numActivePunchPasses + ')';
				this.numHouseholdActivePunchPasses += dataParse.numActivePunchPasses;
			}
			
            this.contactsWithActivePunchPasses = rows;
            this.error = undefined;
			this.isLoading = false;
        } else if (result.error) {
            this.error = result.error;
            this.contactsWithActivePunchPasses = undefined;
			this.isLoading = false;
        }
    }

	@wire(getCompletedPunchPassesByContact, { accountId: '$accountId' })
    wiredCompletedPunchPasses(result) {
		this.wiredContactsWithCompletedPunchPasses = result;
	
        if (result.data) {
			let rows = JSON.parse( JSON.stringify(result.data) );
			for (let i = 0; i < rows.length; i++) {
                let dataParse = rows[i];
				dataParse.fullName = dataParse.FirstName + ' ' + dataParse.LastName;
				dataParse.numCompletedPunchPasses = 
					dataParse.TREX1__Memberships__r != null && dataParse.TREX1__Memberships__r.length > 0 ?
					dataParse.TREX1__Memberships__r.length :
					0;
				dataParse.sectionLabel = dataParse.fullName + ' (' + dataParse.numCompletedPunchPasses + ')';
				this.numHouseholdCompletedPunchPasses += dataParse.numCompletedPunchPasses;
			}
            this.contactsWithCompletedPunchPasses = rows;
            this.error = undefined;
			this.isLoading = false;
        } else if (result.error) {
            this.error = result.error;
            this.contactsWithCompletedPunchPasses = undefined;
			this.isLoading = false;
        }
    }


}
import { LightningElement, wire, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import getActivePunchPassesByContact from '@salesforce/apex/CommunityPunchPassesController.getActivePunchPassesByContact';
import getCompletedPunchPassesByContact from '@salesforce/apex/CommunityPunchPassesController.getCompletedPunchPassesByContact';
import getTransactionReceiptId from '@salesforce/apex/CommunityPunchPassesController.getTransactionReceiptId';
import getPassDecrements from '@salesforce/apex/CommunityPunchPassesController.getPassDecrements';

import USER_ID from '@salesforce/user/Id';
import CONTACTID_FIELD from '@salesforce/schema/User.ContactId';
import ACCOUNTID_FIELD from '@salesforce/schema/User.AccountId';
import ACCOUNTNAME_FIELD from '@salesforce/schema/User.Account.Name';

const actions = [
    { label: 'Download Receipt', name: 'download_receipt' },
    { label: 'View Decrements', name: 'view_decrements' }
];

const COLS = [
    { label: 'Package', fieldName: 'TREX1__Type__c', type: 'text', hideDefaultActions: true },
    { label: 'Used', fieldName: 'TREX1__Total_Value__c', type: 'number', fixedWidth: 144, hideDefaultActions: true,
		cellAttributes: { 
			alignment: 'left' 
		}
	},
    { label: 'Remaining', fieldName: 'TREX1__Remaining_Value__c', type: 'number', fixedWidth: 144, hideDefaultActions: true,
		cellAttributes: { 
			alignment: 'left' 
		}
	},
	{ label: 'Expiration Date', fieldName: 'TREX1__End_Date__c', type: 'date', fixedWidth: 144, hideDefaultActions: true, 
		typeAttributes:{
			year: "numeric",
			month: "long",
			day: "2-digit"
		}
	},
	{
        type: 'action',
        typeAttributes: { rowActions: actions },
    }
];

export default class CommunityPunchPasses extends NavigationMixin(LightningElement) {
	@api membershipCategoryNames = '';
	@api packageReferenceNameSingular = '';
	@api packageReferenceNamePlural = '';
	@api modalHeader = '';

	isLoading = false;
	error;

	showModal = false;
	modalContent;
	decrements = [];

	contactId;
	accountId;
	accountName;

	cols = COLS;
	contactsWithActivePunchPasses;
	wiredContactsWithActivePunchPasses = [];
	contactsWithCompletedPunchPasses;
	wiredContactsWithCompletedPunchPasses = [];

	numHouseholdActivePunchPasses;
	numHouseholdCompletedPunchPasses;

	selectedReceiptId = '';

	get noPunchPassActivityDescription() {
		return 'No ' + this.packageReferenceNameSingular + ' Data';
	}

	get noActivePunchPassesDescription() {
		return 'No Active ' + this.packageReferenceNamePlural;
	}

	get noCompletedPunchPassesDescription() {
		return 'No Completed ' + this.packageReferenceNamePlural;
	}

	get noActivePunchPassesDescriptionContact() {
		return 'This contact does not have any active ' + this.packageReferenceNamePlural;
	}

	get noCompletedPunchPassesDescriptionContact() {
		return 'This contact does not have any completed ' + this.packageReferenceNamePlural;
	}

	get cardTitle() {
		return this.accountName != null ? this.packageReferenceNamePlural + ' for ' + this.accountName : this.packageReferenceNamePlural;
	}

	get activePunchPassesSectionLabel() {
		return 'Active ' + this.packageReferenceNamePlural + ' (' + this.numHouseholdActivePunchPasses + ')';
	}

	get completedPunchPassesSectionLabel() {
		return 'Completed ' + this.packageReferenceNamePlural + ' (' + this.numHouseholdCompletedPunchPasses + ')';
	}

	get householdHasPunchPassActivity() {
		return (this.numHouseholdActivePunchPasses != null && this.numHouseholdActivePunchPasses > 0) || 
			(this.numHouseholdCompletedPunchPasses != null && this.numHouseholdCompletedPunchPasses > 0) ? 
			true : 
			false;
	}

	get householdHasActivePunchPasses() {
		return this.numHouseholdActivePunchPasses != null && this.numHouseholdActivePunchPasses > 0 ? true : false;
	}

	get householdHasCompletedPunchPasses() {
		return this.numHouseholdCompletedPunchPasses != null && this.numHouseholdCompletedPunchPasses > 0 ? true : false;
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

	@wire(getActivePunchPassesByContact, { 
		accountId: '$accountId',
		strMembershipCategoryNames: '$membershipCategoryNames'
	}) wiredActivePunchPasses(result) {
		this.wiredContactsWithActivePunchPasses = result;
		this.numHouseholdActivePunchPasses = 0;
	
        if (result.data) {
			let rows = JSON.parse( JSON.stringify(result.data) );
			for (let i = 0; i < rows.length; i++) {
                let dataParse = rows[i];
				let label = '';
				dataParse.fullName = dataParse.FirstName + ' ' + dataParse.LastName;
				dataParse.numActivePunchPasses = 
					dataParse.TREX1__Memberships__r != null && dataParse.TREX1__Memberships__r.length > 0 ?
					dataParse.TREX1__Memberships__r.length :
					0;
				label = dataParse.fullName + ' - ' + dataParse.numActivePunchPasses;
				label += dataParse.numActivePunchPasses == 1 ?
					' Active ' + this.packageReferenceNameSingular :
					' Active ' + this.packageReferenceNamePlural;
				dataParse.sectionLabel = label;
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

	@wire(getCompletedPunchPassesByContact, { 
		accountId: '$accountId',
		strMembershipCategoryNames: '$membershipCategoryNames'
	}) wiredCompletedPunchPasses(result) {
		this.wiredContactsWithCompletedPunchPasses = result;
		this.numHouseholdCompletedPunchPasses = 0;
	
        if (result.data) {
			let rows = JSON.parse( JSON.stringify(result.data) );
			for (let i = 0; i < rows.length; i++) {
                let dataParse = rows[i];
				let label = '';
				dataParse.fullName = dataParse.FirstName + ' ' + dataParse.LastName;
				dataParse.numCompletedPunchPasses = 
					dataParse.TREX1__Memberships__r != null && dataParse.TREX1__Memberships__r.length > 0 ?
					dataParse.TREX1__Memberships__r.length :
					0;
				label = dataParse.fullName + ' - ' + dataParse.numCompletedPunchPasses;
				label += dataParse.numCompletedPunchPasses == 1 ?
					' Completed ' + this.packageReferenceNameSingular :
					' Completed ' + this.packageReferenceNamePlural;
				dataParse.sectionLabel = label;
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

	handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
		const transactionId = row.TREX1__Purchasing_Transaction__c;
        switch (actionName) {
            case 'download_receipt':
                this.downloadReceipt(transactionId);
                break;
            case 'view_decrements':
                this.viewDecrements(row);
                break;
            default:
        }
    }

	downloadReceipt(transactionId) {

		getTransactionReceiptId({ transactionId: transactionId })
            .then((result) => {
                this.selectedReceiptId = result;
				let baseUrl = this.getBaseUrl();
				let downloadUrl = baseUrl+'servlet/servlet.FileDownload?file='+this.selectedReceiptId;
				this[NavigationMixin.Navigate]({
						type: 'standard__webPage',
						attributes: {
							url: downloadUrl
						}
					}, false 
				);
                this.error = undefined;
            })
            .catch((error) => {
                this.error = error;
                this.selectedReceiptId = undefined;
            });

    }

	viewDecrements(row) {
		let rowId = row.Id;
		console.log(rowId);

		getPassDecrements({ membershipId: rowId })
            .then((result) => {
                this.decrements = result;
				this.modalContent = this.decrements.join("\n");
                this.error = undefined;
				this.showModal = true;
            })
            .catch((error) => {
                this.error = error;
                this.decrements = undefined;
            });
	}

	getBaseUrl(){
        let baseUrl = 'https://'+location.host+'/';
        return baseUrl;
    }

	handleModalClose() {
        this.showModal = false;
    }

	refreshComponent() {
		this.isLoading = true;
		refreshApex(this.wiredContactsWithActivePunchPasses);
		refreshApex(this.wiredContactsWithCompletedPunchPasses);
		this.isLoading = false;
	}


}
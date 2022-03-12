@isTest
private class CommunityPunchPassesController_Test {

    private static Id hhRecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('HH_Account').getRecordTypeId();
    private static Id punchPassRecTypeId = Schema.SObjectType.TREX1__Membership__c.getRecordTypeInfosByDeveloperName().get('Punch_Pass_Membership').getRecordTypeId();
    
    private static final String STATUS_ACTIVE = 'Active';
    private static final String STATUS_COMPLETE = 'Complete';
    private static final Integer ACTIVE_PUNCH_PASS_STORED_VALUE = 6;
    private static final Integer COMPLETED_PUNCH_PASS_STORED_VALUE = 1;
    private static final Integer NUMBER_OF_CONTACTS = 5;
    private static final Integer NUMBER_OF_COMPLETED_MEMBERSHIPS = 1;

    @TestSetup
    static void makeData() {

        Account acc = new Account(Name = 'Test Account', RecordTypeId = hhRecordTypeId);
        insert acc;

        List<Contact> lstContacts = new List<Contact>();
        for (Integer i = 0; i < NUMBER_OF_CONTACTS; i++) {
            lstContacts.add(
                new Contact(
                    AccountId = acc.Id,
                    FirstName = 'Test' + String.valueOf(i),
                    LastName = 'Testeroo',
                    Email = 'test@testerton.com',
                    Birthdate = Date.today().addYears(-(i * 5)).addMonths(i)
                )
            );
        }
        insert lstContacts;

        List<TREX1__Membership__c> lstMemberships = new List<TREX1__Membership__c>();
        // Completed membership
        lstMemberships.add(
            new TREX1__Membership__c(
                TREX1__Contact__c = lstContacts.get(0).Id, 
                TREX1__Account__c = acc.Id, 
                RecordTypeId = punchPassRecTypeId, 
                TREX1__Status__c = STATUS_COMPLETE,
                TREX1__Start_Date__c = Date.today().addDays(-1),
                TREX1__Stored_Value__c = 1
            )
        );
        // Active memberships
        for (Contact ct : lstContacts) {
            lstMemberships.add(
                new TREX1__Membership__c(
                    TREX1__Contact__c = ct.Id, 
                    TREX1__Account__c = acc.Id, 
                    RecordTypeId = punchPassRecTypeId, 
                    TREX1__Status__c = STATUS_ACTIVE,
                    TREX1__Start_Date__c = Date.today().addDays(-1),
                    TREX1__Stored_Value__c = 6
                )
            );
        }
        insert lstMemberships;
        
        // Decrement completed punch pass so remaining equals zero
        TREX1__Pass_Decrement__c pd = new TREX1__Pass_Decrement__c();
        pd.TREX1__Date__c = Datetime.now();
        pd.TREX1__Membership_Punch_Pass_Decrement__c = lstMemberships.get(0).Id;
        pd.TREX1__Value__c = 1;
        insert pd;
    }
    
    @isTest
    static void testQueryForActivePunchPasses() {
        
        Account acc = [SELECT Id FROM Account LIMIT 1];

        Test.startTest();
        List<Contact> lstCtsWithActiveMems = new List<Contact>();
        lstCtsWithActiveMems = CommunityPunchPassesController.getActivePunchPassesByContact(acc.Id);
        Test.stopTest();

        System.assertEquals(
            NUMBER_OF_CONTACTS, 
            lstCtsWithActiveMems.size(), 
            'Should have received five memberships'
        );
        
        System.assertEquals(
            STATUS_ACTIVE, 
            lstCtsWithActiveMems.get(0).TREX1__Memberships__r.get(0).TREX1__Status__c, 
            'Membership status should be active'
        );

    }

    @isTest
    static void testQueryForCompletedPunchPasses() {
        
        Account acc = [SELECT Id FROM Account LIMIT 1];

        Test.startTest();
        List<Contact> lstCtsWithCompletedMems = new List<Contact>();
        lstCtsWithCompletedMems = CommunityPunchPassesController.getCompletedPunchPassesByContact(acc.Id);
        Test.stopTest();
        
        System.assertEquals(
            NUMBER_OF_COMPLETED_MEMBERSHIPS, 
            lstCtsWithCompletedMems.size(), 
            'Should have one completed punch pass'
        );
        
        System.assertEquals(
            'Complete', 
            lstCtsWithCompletedMems.get(0).TREX1__Memberships__r.get(0).TREX1__Status__c, 
            'Status should be complete'
        );
        
    }

}
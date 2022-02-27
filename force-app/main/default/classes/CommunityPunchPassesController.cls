public with sharing class CommunityPunchPassesController {

    private static final String PUNCH_PASS_RECORDTYPE_NAME = 'Punch_Pass_Membership';
    private static final String MEMBERSHIP_STATUS_COMPLETE = 'Complete';

    @AuraEnabled(cacheable=true)
    public static List<Contact> getActivePunchPassesByContact(
        String accountId
    ) {
        return [
            SELECT Id, FirstName, LastName, 
                   (SELECT Id, Name, TREX1__Contact__c, TREX1__Contact__r.Name, TREX1__Contact__r.FirstName,
                           TREX1__memb_Type__r.Name, TREX1__Type__c, TREX1__Category_Name__c, TREX1__Status__c,
                           TREX1__Account__r.Name, TREX1__Start_Date__c, TREX1__End_Date__c, 
                           TREX1__Remaining_Value__c, TREX1__Stored_Value__c, TREX1__Total_Value__c, CreatedDate
                      FROM TREX1__Memberships__r
                     WHERE RecordType.DeveloperName = :PUNCH_PASS_RECORDTYPE_NAME
                       AND TREX1__Remaining_Value__c > 0
                     ORDER BY TREX1__End_Date__c ASC NULLS LAST)
              FROM Contact
             WHERE AccountId = :accountId
               AND Id IN (SELECT TREX1__Contact__c
                            FROM TREX1__Membership__c
                           WHERE RecordType.DeveloperName = :PUNCH_PASS_RECORDTYPE_NAME
                             AND TREX1__Remaining_Value__c > 0)
              //WITH SECURITY_ENFORCED
             ORDER BY FirstName ASC
             LIMIT 10000
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Contact> getCompletedPunchPassesByContact(
        String accountId
    ) {
        return [
            SELECT Id, FirstName, LastName, 
                   (SELECT Id, Name, TREX1__Contact__c, TREX1__Contact__r.Name, TREX1__Contact__r.FirstName,
                           TREX1__memb_Type__r.Name, TREX1__Type__c, TREX1__Category_Name__c, TREX1__Status__c,
                           TREX1__Account__r.Name, TREX1__Start_Date__c, TREX1__End_Date__c, 
                           TREX1__Remaining_Value__c, TREX1__Stored_Value__c, TREX1__Total_Value__c, CreatedDate
                      FROM TREX1__Memberships__r
                     WHERE RecordType.DeveloperName = :PUNCH_PASS_RECORDTYPE_NAME
                       AND ((TREX1__Stored_Value__c > 0 
                           AND TREX1__Remaining_Value__c = 0)
                        OR TREX1__Status__c = :MEMBERSHIP_STATUS_COMPLETE)
                     ORDER BY TREX1__End_Date__c ASC NULLS LAST)
              FROM Contact
             WHERE AccountId = :accountId
               AND Id IN (SELECT TREX1__Contact__c
                            FROM TREX1__Membership__c
                           WHERE RecordType.DeveloperName = :PUNCH_PASS_RECORDTYPE_NAME
                             AND ((TREX1__Stored_Value__c > 0 
                                 AND TREX1__Remaining_Value__c = 0)
                              OR TREX1__Status__c = :MEMBERSHIP_STATUS_COMPLETE))
              //WITH SECURITY_ENFORCED
             ORDER BY FirstName ASC
             LIMIT 10000
        ];
    }


}

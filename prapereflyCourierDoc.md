## paperfly courier api documentation

### create order

POST
https://api.paperfly.com.bd/merchant/api/service/new_order_v2.php

Authorization

Type: Basic Auth

Username: Merchant Panel User Name

Password: Merchant Panel Password

Required Headers

paperflykey: Paperfly\_~La?Rj73FcLm

Content-Type: application/json

Request Payload

{
"merchantOrderReference": "Test_01610",
"storeName": "Ovi",
"productBrief": "Test Product",
"packagePrice": "10",
"max_weight": "0.3",
"customerName": "Liton Ovi",
"customerAddress": "Banani, Dhaka",
"customerPhone": "01610202717"
}
Success Response

{
"success": {
"message": "successfully inserted",
"tracking_number": "Z-051125-63821-A3-A1",
"tracking_barcode": "751820115459"
},
"response_code": 200
}

### get tracking info

POST
https://api.paperfly.com.bd/API-Order-Tracking

Request Payload

{
"ReferenceNumber": "Test_01610"
}
Authorization

Type: Basic Auth

Username: Merchant Panel User Name

Password: Merchant Panel Password

Success Response

{
"success": {
"message": "success",
"trackingStatus": [
{
"invNum": "",
"receivedAmount": "",
"Pick": null,
"PickTime": null,
"inTransit": "",
"inTransitTime": "",
"ReceivedAtPoint": "",
"ReceivedAtPointTime": "",
"PickedForDelivery": "",
"PickedForDeliveryTime": "",
"Delivered": "",
"DeliveredTime": "",
"Returned": "",
"ReturnedTime": "",
"Partial": "",
"PartialTime": "",
"onHoldSchedule": "",
"close": "",
"closeTime": ""
}
]
},
"response_code": 200
}

# 📖 ParaBank REST API Complete Specification & Execution Reference

This document provides a complete, literal reference for every REST API endpoint called across the automated test suites in this project. All examples use **actual, concrete values** (no code wrappers, placeholders, or variables) matching the test execution contracts against `https://parabank.parasoft.com/parabank`.

---

## 📌 Global Configuration & Base URL

* **Base URL**: `https://parabank.parasoft.com/parabank/services/bank`
* **Default Credentials**: `john` / `demo`
* **Default Customer ID**: `12212`
* **Primary Account ID**: `13344`
* **Secondary Account ID**: `13455`
* **Default Response Format**: XML (`Accept: application/xml`)

---

## 📑 Table of Contents

1. [Database Administration](#1-database-administration)
   - [POST /cleanDB](#11-clean-database)
   - [POST /initializeDB](#12-initialize-database)
2. [Authentication & Login](#2-authentication--login)
   - [GET /login/{username}/{password}](#21-login-user)
   - [Negative & Security Login Probes](#22-negative--security-login-probes)
3. [Customer Profile Management](#3-customer-profile-management)
   - [GET /customers/{customerId}](#31-get-customer-profile)
   - [POST /customers/update/{customerId}](#32-update-customer-profile)
4. [Account Lifecycle Management](#4-account-lifecycle-management)
   - [GET /customers/{customerId}/accounts](#41-get-all-customer-accounts)
   - [GET /accounts/{accountId}](#42-get-single-account-details)
   - [POST /createAccount](#43-create-new-account)
5. [Transfers, Deposits & Withdrawals](#5-transfers-deposits--withdrawals)
   - [POST /transfer](#51-transfer-funds)
   - [POST /deposit](#52-deposit-funds)
   - [POST /withdraw](#53-withdraw-funds)
6. [Bill Payment Service](#6-bill-payment-service)
   - [POST /billpay](#61-execute-bill-payment)
7. [Loan Application Processing](#7-loan-application-processing)
   - [POST /requestLoan](#71-submit-loan-request)
8. [Transaction Inquiries & Multi-Attribute Search](#8-transaction-inquiries--multi-attribute-search)
   - [GET /accounts/{accountId}/transactions](#81-get-all-transactions-for-an-account)
   - [GET /transactions/{transactionId}](#82-get-transaction-by-id)
   - [GET /accounts/{accountId}/transactions/onDate/{date}](#83-search-transactions-by-date)
   - [GET /accounts/{accountId}/transactions/fromDate/{from}/toDate/{to}](#84-search-transactions-by-date-range)
   - [GET /accounts/{accountId}/transactions/amount/{amount}](#85-search-transactions-by-amount)
   - [GET /accounts/{accountId}/transactions/month/{month}/type/{type}](#86-search-transactions-by-month-and-type)

---

## 1. Database Administration

### 1.1 Clean Database
Wipes customer data, transaction records, and created accounts.

* **Method**: `POST`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/cleanDB`
* **Headers**:
  ```http
  Accept: */*
  ```
* **Request Body**: *None*
* **Expected Response**:
  - **Status**: `204 No Content`
  - **Body**: *Empty*
* **Tests Using It**: `TC-API-ADM-001`, `TC-API-ADM-003`, `banking-api STEP 9`

---

### 1.2 Initialize Database
Re-seeds the demo database back to default state (restores default user `john` and sample accounts).

* **Method**: `POST`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/initializeDB`
* **Headers**:
  ```http
  Accept: */*
  ```
* **Request Body**: *None*
* **Expected Response**:
  - **Status**: `204 No Content`
  - **Body**: *Empty*
* **Tests Using It**: `TC-API-ADM-002`, `TC-API-ADM-004`

---

## 2. Authentication & Login

### 2.1 Login User (Positive)
Authenticates valid credentials and retrieves the customer identity profile.

* **Method**: `GET`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/login/john/demo`
* **Headers**:
  ```http
  Accept: application/xml
  ```
* **Request Parameters**:
  - `username` (path): `john`
  - `password` (path): `demo`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Content-Type**: `application/xml`
  - **Body (Actual XML)**:
    ```xml
    <customer>
      <id>12212</id>
      <firstName>John</firstName>
      <lastName>Smith</lastName>
      <address>
        <street>1431 Main St</street>
        <city>Beverly Hills</city>
        <state>CA</state>
        <zipCode>90210</zipCode>
      </address>
      <phoneNumber>310-447-4121</phoneNumber>
      <ssn>321-45-6789</ssn>
    </customer>
    ```
* **Tests Using It**: `TC-API-AUTH-001`, `TC-API-AUTH-002`, `beforeAll` in all test suites

---

### 2.2 Negative & Security Login Probes

#### A. Invalid Password
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/login/john/WrongPassword123!`
* **Expected Status**: `400 Bad Request`
* **Tests Using It**: `TC-API-AUTH-003`

#### B. Non-Existent User
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/login/nonExistentUser_987654/demo`
* **Expected Status**: `400 Bad Request`
* **Tests Using It**: `TC-API-AUTH-004`

#### C. SQL Injection Probe
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/login/'%20OR%20'1'='1/demo`
* **Expected Status**: `400 Bad Request` (or `403 Forbidden` if blocked by WAF)
* **Tests Using It**: `TC-API-AUTH-005`

#### D. Special Character Probe
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/login/%3Cscript%3Ealert(1)%3C%2Fscript%3E/demo`
* **Expected Status**: `400 Bad Request`
* **Tests Using It**: `TC-API-AUTH-006`

---

## 3. Customer Profile Management

### 3.1 Get Customer Profile
Fetches complete customer details by numeric customer ID.

* **Method**: `GET`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/customers/12212`
* **Headers**:
  ```http
  Accept: application/xml
  ```
* **Path Parameters**:
  - `customerId`: `12212`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual XML)**:
    ```xml
    <customer>
      <id>12212</id>
      <firstName>John</firstName>
      <lastName>Smith</lastName>
      <address>
        <street>1431 Main St</street>
        <city>Beverly Hills</city>
        <state>CA</state>
        <zipCode>90210</zipCode>
      </address>
      <phoneNumber>310-447-4121</phoneNumber>
      <ssn>321-45-6789</ssn>
    </customer>
    ```
* **Negative Variations**:
  - `GET .../customers/99999999` $\rightarrow$ `400 Bad Request` or `404 Not Found`
  - `GET .../customers/abc-xyz-invalid` $\rightarrow$ `400 Bad Request`
* **Tests Using It**: `TC-API-CUST-001`, `TC-API-CUST-003`, `TC-API-CUST-004`

---

### 3.2 Update Customer Profile
Updates John Smith's contact details via Spring MVC query-string parameter binding.

* **Method**: `POST`
* **URL**:
  ```
  https://parabank.parasoft.com/parabank/services/bank/customers/update/12212?firstName=John&lastName=Smith&address.street=1431+Main+St&street=1431+Main+St&address.city=Beverly+Hills&city=Beverly+Hills&address.state=CA&state=CA&address.zipCode=90210&zipCode=90210&phoneNumber=555-0199&ssn=123-45-6789&username=john&password=demo
  ```
* **Headers**:
  ```http
  Accept: application/xml, text/plain
  ```
* **Parameters Passed in URL**:
  - `customerId` (path): `12212`
  - `firstName`: `John`
  - `lastName`: `Smith`
  - `street`: `1431 Main St`
  - `city`: `Beverly Hills`
  - `state`: `CA`
  - `zipCode`: `90210`
  - `phoneNumber`: `555-0199`
  - `ssn`: `123-45-6789`
  - `username`: `john`
  - `password`: `demo`
* **Expected Response**:
  - **Status**: `200 OK`
* **Tests Using It**: `TC-API-CUST-002`, `TC-API-CUST-005`

---

## 4. Account Lifecycle Management

### 4.1 Get All Customer Accounts
Retrieves the list of accounts owned by the customer.

* **Method**: `GET`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/customers/12212/accounts`
* **Headers**:
  ```http
  Accept: application/xml
  ```
* **Path Parameters**:
  - `customerId`: `12212`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual XML)**:
    ```xml
    <accounts>
      <account>
        <id>13344</id>
        <customerId>12212</customerId>
        <type>CHECKING</type>
        <balance>1000.00</balance>
      </account>
      <account>
        <id>13455</id>
        <customerId>12212</customerId>
        <type>SAVINGS</type>
        <balance>2500.50</balance>
      </account>
    </accounts>
    ```
* **Negative Variations**:
  - `GET .../customers/99999999/accounts` $\rightarrow$ `400` or `404`
* **Tests Using It**: `TC-API-ACC-001`, `TC-API-ACC-008`, `banking-api STEP 2`

---

### 4.2 Get Single Account Details
Retrieves specific account metadata (type, balance, customerId).

* **Method**: `GET`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/accounts/13344`
* **Headers**:
  ```http
  Accept: application/xml
  ```
* **Path Parameters**:
  - `accountId`: `13344`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual XML)**:
    ```xml
    <account>
      <id>13344</id>
      <customerId>12212</customerId>
      <type>CHECKING</type>
      <balance>1000.00</balance>
    </account>
    ```
* **Negative Variations**:
  - `GET .../accounts/99999999` $\rightarrow$ `400` or `404`
  - `GET .../accounts/abc-xyz-invalid` $\rightarrow$ `400` or `404`
* **Tests Using It**: `TC-API-ACC-002`, `TC-API-ACC-005`, `TC-API-ACC-006`, `banking-api STEP 3`

---

### 4.3 Create New Account
Opens a new CHECKING (`0`) or SAVINGS (`1`) account, funded from an existing account.

#### A. Create CHECKING Account (`Type 0`)
* **Method**: `POST`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/createAccount?customerId=12212&newAccountType=0&fromAccountId=13344`
* **Headers**:
  ```http
  Accept: application/xml
  ```
* **Query Parameters**:
  - `customerId`: `12212`
  - `newAccountType`: `0`
  - `fromAccountId`: `13344`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual XML)**:
    ```xml
    <account>
      <id>13567</id>
      <customerId>12212</customerId>
      <type>CHECKING</type>
      <balance>100.00</balance>
    </account>
    ```
* **Tests Using It**: `TC-API-ACC-003`

#### B. Create SAVINGS Account (`Type 1`)
* **Method**: `POST`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/createAccount?customerId=12212&newAccountType=1&fromAccountId=13344`
* **Headers**:
  ```http
  Accept: application/xml
  ```
* **Query Parameters**:
  - `customerId`: `12212`
  - `newAccountType`: `1`
  - `fromAccountId`: `13344`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual XML)**:
    ```xml
    <account>
      <id>13678</id>
      <customerId>12212</customerId>
      <type>SAVINGS</type>
      <balance>100.00</balance>
    </account>
    ```
* **Tests Using It**: `TC-API-ACC-004`, `banking-api STEP 4`

#### C. Negative Case (Non-existent source account)
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/createAccount?customerId=12212&newAccountType=0&fromAccountId=99999999`
* **Expected Status**: `400 Bad Request` or `404 Not Found`
* **Tests Using It**: `TC-API-ACC-007`

---

## 5. Transfers, Deposits & Withdrawals

### 5.1 Transfer Funds
Transfers money between two accounts.

* **Method**: `POST`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/transfer?fromAccountId=13344&toAccountId=13455&amount=25.0`
* **Headers**:
  ```http
  Accept: application/xml, text/plain
  ```
* **Query Parameters**:
  - `fromAccountId`: `13344`
  - `toAccountId`: `13455`
  - `amount`: `25.0`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual Text)**:
    ```
    Successfully transferred $25.00 from account #13344 to account #13455
    ```
* **Negative Variations**:
  - `toAccountId=99999999` $\rightarrow$ `400` or `404` (`TC-API-TXF-005`)
  - `fromAccountId=99999999` $\rightarrow$ `400` or `404` (`TC-API-TXF-006`)
  - `amount=-100` $\rightarrow$ `200 OK` with text `"Successfully transferred $-100.00..."` (ParaBank backend logic quirk) (`TC-API-TXF-007`)
* **Tests Using It**: `TC-API-TXF-001`, `banking-api STEP 6`

---

### 5.2 Deposit Funds
Deposits funds into a target account.

* **Method**: `POST`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/deposit?accountId=13344&amount=150.0`
* **Headers**:
  ```http
  Accept: application/xml, text/plain
  ```
* **Query Parameters**:
  - `accountId`: `13344`
  - `amount`: `150.0`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual Text)**:
    ```
    Successfully deposited $150.00 to account #13344
    ```
* **Negative Variations**:
  - `accountId=99999999` $\rightarrow$ `400` or `404` (`TC-API-TXF-008`)
* **Tests Using It**: `TC-API-TXF-002`, `banking-api STEP 5`

---

### 5.3 Withdraw Funds
Withdraws money from an existing account.

* **Method**: `POST`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/withdraw?accountId=13344&amount=50.0`
* **Headers**:
  ```http
  Accept: application/xml, text/plain
  ```
* **Query Parameters**:
  - `accountId`: `13344`
  - `amount`: `50.0`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual Text)**:
    ```
    Successfully withdrew $50.00 from account #13344
    ```
* **Negative Variations**:
  - `accountId=99999999` $\rightarrow$ `400` or `404` (`TC-API-TXF-009`)
* **Tests Using It**: `TC-API-TXF-003`

---

## 6. Bill Payment Service

### 6.1 Execute Bill Payment
Submits an electronic bill payment to an external payee utility.

* **Method**: `POST`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/billpay?accountId=13344&amount=50.0`
* **Headers**:
  ```http
  Content-Type: application/xml
  Accept: application/xml, text/plain, application/json
  ```
* **Query Parameters**:
  - `accountId`: `13344`
  - `amount`: `50.0`
* **Request Body (Actual XML Payload)**:
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <payee>
    <name>Electric Utility Co</name>
    <address>
      <street>100 Power Lane</street>
      <city>Metropolis</city>
      <state>NY</state>
      <zipCode>10001</zipCode>
    </address>
    <phoneNumber>555-0100</phoneNumber>
    <accountNumber>987654321</accountNumber>
  </payee>
  ```
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual XML)**:
    ```xml
    <billPayResult>
      <accountId>13344</accountId>
      <amount>50.00</amount>
      <payeeName>Electric Utility Co</payeeName>
    </billPayResult>
    ```
* **Tests Using It**: `TC-API-TXF-004`

---

## 7. Loan Application Processing

### 7.1 Submit Loan Request

#### A. Approved Loan Request
* **Method**: `POST`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/requestLoan?customerId=12212&amount=1000&downPayment=100&fromAccountId=13344`
* **Headers**:
  ```http
  Accept: application/xml
  ```
* **Query Parameters**:
  - `customerId`: `12212`
  - `amount`: `1000` (Qualifying standard amount)
  - `downPayment`: `100` (10% standard down payment)
  - `fromAccountId`: `13344`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual XML)**:
    ```xml
    <loanResponse>
      <approved>true</approved>
      <accountId>13789</accountId>
      <message>Loan Approved</message>
    </loanResponse>
    ```
* **Tests Using It**: `TC-API-LOAN-001`, `banking-api STEP 8`

---

#### B. Denied Loan Request (High Amount / Low Down Payment)
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/requestLoan?customerId=12212&amount=10000000&downPayment=1&fromAccountId=13344`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual XML)**:
    ```xml
    <loanResponse>
      <approved>false</approved>
      <message>error.insufficient.funds.for.down.payment</message>
    </loanResponse>
    ```
* **Tests Using It**: `TC-API-LOAN-002`

---

#### C. Negative Loan Variations
* **Invalid Funding Account**:
  - `POST .../requestLoan?customerId=12212&amount=1000&downPayment=100&fromAccountId=99999999`
  - **Status**: `400 Bad Request` or `404 Not Found` (`TC-API-LOAN-003`)
* **Non-existent Customer ID**:
  - `POST .../requestLoan?customerId=99999999&amount=1000&downPayment=100&fromAccountId=13344`
  - **Status**: `200 OK` with `<approved>false</approved>` (`TC-API-LOAN-004`)
* **Negative Loan Amount**:
  - `POST .../requestLoan?customerId=12212&amount=-5000&downPayment=100&fromAccountId=13344`
  - **Status**: `200 OK` with `<approved>false</approved>` (`TC-API-LOAN-005`)
* **Negative Down Payment Amount**:
  - `POST .../requestLoan?customerId=12212&amount=100000&downPayment=-100&fromAccountId=13344`
  - **Status**: `200 OK` with `<approved>false</approved>` (`TC-API-LOAN-006`)

---

## 8. Transaction Inquiries & Multi-Attribute Search

### 8.1 Get All Transactions for an Account
Retrieves full transaction history of an account.

* **Method**: `GET`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/accounts/13344/transactions`
* **Headers**:
  ```http
  Accept: application/xml
  ```
* **Path Parameters**:
  - `accountId`: `13344`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual XML)**:
    ```xml
    <transactions>
      <transaction>
        <id>14123</id>
        <accountId>13344</accountId>
        <type>Debit</type>
        <date>2026-11-10T00:00:00.000-05:00</date>
        <amount>25.00</amount>
        <description>Funds Transfer Sent</description>
      </transaction>
      <transaction>
        <id>14124</id>
        <accountId>13344</accountId>
        <type>Credit</type>
        <date>2026-11-10T00:00:00.000-05:00</date>
        <amount>150.00</amount>
        <description>Deposit</description>
      </transaction>
    </transactions>
    ```
* **Negative Variations**:
  - `GET .../accounts/99999999/transactions` $\rightarrow$ `400` or `404` (`TC-API-TXN-009`)
* **Tests Using It**: `TC-API-TXN-001`, `banking-api STEP 7`

---

### 8.2 Get Transaction by ID
Queries detailed record of an individual transaction ID.

* **Method**: `GET`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/transactions/14123`
* **Headers**:
  ```http
  Accept: application/xml
  ```
* **Path Parameters**:
  - `transactionId`: `14123`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual XML)**:
    ```xml
    <transaction>
      <id>14123</id>
      <accountId>13344</accountId>
      <type>Debit</type>
      <date>2026-11-10T00:00:00.000-05:00</date>
      <amount>25.00</amount>
      <description>Funds Transfer Sent</description>
    </transaction>
    ```
* **Negative Variations**:
  - `GET .../transactions/99999999` $\rightarrow$ `400` or `404` (`TC-API-TXN-007`)
* **Tests Using It**: `TC-API-TXN-002`

---

### 8.3 Search Transactions by Date
Filters account transactions occurring on an exact calendar date (`MM-DD-YYYY`).

* **Method**: `GET`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/accounts/13344/transactions/onDate/11-10-2026`
* **Headers**:
  ```http
  Accept: application/xml
  ```
* **Path Parameters**:
  - `accountId`: `13344`
  - `date`: `11-10-2026` (Format: `MM-DD-YYYY`)
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body**: XML `<transactions>` matching the specified date.
* **Negative Variations**:
  - `GET .../onDate/invalid-date-format` $\rightarrow$ `400 Bad Request` (`TC-API-TXN-008`)
* **Tests Using It**: `TC-API-TXN-004`

---

### 8.4 Search Transactions by Date Range
Filters transactions posted between two calendar boundaries.

* **Method**: `GET`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/accounts/13344/transactions/fromDate/01-01-2020/toDate/12-31-2030`
* **Headers**:
  ```http
  Accept: application/xml
  ```
* **Path Parameters**:
  - `accountId`: `13344`
  - `fromDate`: `01-01-2020`
  - `toDate`: `12-31-2030`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body**: XML `<transactions>` containing all records posted between boundaries.
* **Tests Using It**: `TC-API-TXN-005`

---

### 8.5 Search Transactions by Amount
Finds all transactions on an account matching an exact numerical dollar amount.

* **Method**: `GET`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/accounts/13344/transactions/amount/75.0`
* **Headers**:
  ```http
  Accept: application/xml
  ```
* **Path Parameters**:
  - `accountId`: `13344`
  - `amount`: `75.0`
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body (Actual XML)**:
    ```xml
    <transactions>
      <transaction>
        <id>14125</id>
        <accountId>13344</accountId>
        <type>Credit</type>
        <date>2026-11-10T00:00:00.000-05:00</date>
        <amount>75.00</amount>
        <description>Deposit</description>
      </transaction>
    </transactions>
    ```
* **Tests Using It**: `TC-API-TXN-003`

---

### 8.6 Search Transactions by Month and Type
Filters transactions using month identifier and transaction category.

* **Method**: `GET`
* **URL**: `https://parabank.parasoft.com/parabank/services/bank/accounts/13344/transactions/month/All/type/All`
* **Headers**:
  ```http
  Accept: application/xml
  ```
* **Path Parameters**:
  - `accountId`: `13344`
  - `month`: `All` (or `January`, `February`, etc.)
  - `type`: `All` (or `Debit`, `Credit`)
* **Expected Response**:
  - **Status**: `200 OK`
  - **Body**: XML `<transactions>`
* **Tests Using It**: `TC-API-TXN-006`

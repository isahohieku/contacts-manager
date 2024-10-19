
<!-- README.md -->
+ [![cov](https://isahohieku.github.io/contacts-manager/badges/coverage.svg)](https://github.com/isahohieku/contacts-manager/actions)

# Contacts manager API

## Overview

The Contact Manager API provides developers with a robust set of endpoints to manage contacts efficiently within their applications. It allows users to create, retrieve, update, and delete contacts, as well as perform various operations such as searching, sorting, and filtering. It provides endpoints for creating, reading, updating and deleting contacts. Each contact has a first name, last name, email address, phone number, address and more. The API is built using NestJS and uses a PostgreSQL database.

Overall, the Contact Manager API simplifies contact management for developers, offering a reliable and scalable solution for applications that require contact organization and interaction. Whether it's a mobile app, web app, or backend service, developers can leverage this API to enhance their applications with robust contact management capabilities.

## Features

### Contact Management:

- **Create Contact**: Create new contacts by providing details such as name, phone number, email, etc.
- **Retrieve Contact**: Retrieve individual or multiple contacts using search criteria like name, phone number, or email.
- **Update Contact**: Modify existing contact information such as adding new details or editing existing ones.
- **Delete Contact**: Remove contacts from the database by specifying their contact ID or other identifiers.
- **Search Contacts**: Quickly search for contacts by various attributes like name, phone, email, or tags.
- **Sort Contacts**: Organize contacts based on criteria like name, creation date, or last updated date.
- **Filter Contacts**: Apply filters to retrieve contacts that meet certain conditions (e.g., specific categories or tags).
- **Pagination**: Handle large sets of contact data efficiently with paginated responses.

### Admin and User Management:

#### Admin Role:
Admins have full control over the contact management system, including the ability to create, update, and delete users, contacts, and configurations.

- Admins can manage user roles and permissions, ensuring that only authorized users have access to sensitive operations.
- Admins can view and manage the activity of all users and contacts within the system.
- Admins can assign specific roles (e.g., standard user, moderator, etc.) to other users.

#### User Role:
Standard users can create and manage their own contacts.

- Users can access only the contacts and resources assigned to them, based on role-based access control (RBAC).
- Users can update their own account details and preferences, but do not have access to admin-level operations.
- Users can collaborate with others, sharing certain contacts if granted permission by an admin.

#### Authentication and Authorization:

- Supports secure user authentication mechanisms such as JWT (JSON Web Tokens) or OAuth for token-based access control.

- **Role-Based Access Control (RBAC)**: Ensures that different levels of users (admin, standard users) have appropriate permissions to access or modify data.

#### User Management:

- **User Registration and Login**: Allows users to register and log in to the system, managing their own credentials.
- **User Profiles**: Each user has a profile containing personal and account information, which they can manage.
- **Reset Password**: Users can reset their passwords securely through email verification or other multi-factor authentication (MFA) methods.
- **View User List (Admin)**: Admins can view a list of all registered users and manage their accounts.
- **Deactivate/Delete User (Admin)**: Admins have the authority to deactivate or delete user accounts.
Audit Logs (Admin):

### Error Handling:

- Clear, descriptive error messages and HTTP status codes are provided for easier debugging and handling of issues.

### Search and Filters:

- Perform advanced searches based on multiple parameters such as contact names, phone numbers, or email addresses.

- Filters and sorting options help users quickly navigate through large lists of contacts.

### Data Security and Privacy:

- Data is encrypted to ensure the privacy and security of contacts and user information.

- Access to sensitive data is restricted based on the user’s role (admin or standard user).

### Versioning:

API versioning is supported to ensure backward compatibility and smooth transitions when new features are introduced.

### Comprehensive Documentation:

Detailed API documentation, including usage instructions, example requests, and responses, is provided to assist developers in integration.


## Technologies Used
- **NestJS**: A progressive Node.js framework for building efficient and scalable server-side applications.
- **TypeScript**: Typed superset of JavaScript for better code quality and maintainability.
- **PostgreSQL**: Relational database management system.
- **TypeORM**: ORM for TypeScript and JavaScript.
- **Swagger**: API documentation.
- **Docker**: Containerization for development and deployment.
- **Jest**: Testing framework for JavaScript.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 14.x or later)
- [PostgreSQL](https://www.postgresql.org/) (version 12 or later)
- [Docker](https://www.docker.com/) (optional, for containerized development)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/isahohieku/contacts-manager.git
   cd contacts-manager
   ```

2. **Install Dependencies**

   ```bash
   yarn install
   ```

3. **Set Up Environment Variables**

   Rename `env-example` file to `.env` in the root directory and modify environment variables where necessary


4. **Run the Database Migrations**

   Run migrations to set up the database schema:

   ```bash
   yarn run migration:run
   ```

5. **Seed Database**

   Seed databse with necessary data:

   ```bash
   yarn run seed:run
   ```

6. **Start mail server**

   To run the local mail server:

   ```bash
   docker compose up maildev
   ```

7. **Start Application**

   ```bash
   yarn run start:dev
   ```

   The API should now be running at `http://localhost:3000`.

### API Documentation

The API is documented using Swagger. Once the server is running, you can access the API documentation at:

```
http://localhost:3000/docs
```

### Testing

To test the app with jest, run

```
yarn run test:e2e
```

For test coverage, run

```
yarn run test:e2e:cov
```


## Contributing

Contributions are welcome! Please fork the repository, make your changes, and submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

# Contact Management API Documentation

Welcome to the comprehensive documentation for the Contact Management API. This documentation provides detailed information about the API endpoints, authentication, data models, and development guidelines.

## 📚 Documentation Structure

### Quick Start
- [Getting Started](./getting-started.md) - Setup and installation guide
- [Authentication](./authentication.md) - Authentication and authorization
- [API Reference](./api-reference.md) - Complete API endpoint documentation

### Development
- [Development Guide](./development-guide.md) - Development setup and best practices
- [Testing Guide](./testing-guide.md) - Testing strategies and examples
- [Deployment Guide](./deployment-guide.md) - Production deployment instructions

### Architecture
- [Architecture Overview](./architecture.md) - System architecture and design patterns
- [Database Schema](./database-schema.md) - Database structure and relationships
- [Security](./security.md) - Security features and best practices

### Examples
- [Code Examples](./examples/) - Practical usage examples
- [Postman Collection](./postman/) - API testing collection

## 🚀 Quick Links

- **API Documentation**: [http://localhost:3000/docs](http://localhost:3000/docs) (Swagger UI)
- **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)
- **Repository**: [GitHub Repository](https://github.com/isahohieku/contacts-manager)

## 📋 API Overview

The Contact Management API is a RESTful service built with NestJS that provides comprehensive contact management capabilities including:

- **Contact Management**: Create, read, update, delete contacts
- **User Management**: User registration, authentication, and profile management
- **File Management**: Avatar and file upload/download
- **Search & Filtering**: Advanced search and filtering capabilities
- **Data Export**: CSV export functionality
- **Security**: JWT authentication, role-based access control
- **Performance**: Redis caching, query optimization
- **Monitoring**: Health checks, logging, performance metrics

## 🔧 Key Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin/User)
- Email verification
- Password reset functionality

### Contact Management
- Full CRUD operations for contacts
- Multiple contact details (emails, phones, addresses)
- Contact categorization with tags
- File attachments and avatars
- Advanced search and filtering

### Performance & Scalability
- Redis caching for improved performance
- Database query optimization
- Response compression
- Rate limiting
- Pagination support

### Security
- Helmet.js security headers
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

## 📊 API Statistics

- **Total Endpoints**: 50+
- **API Version**: v1
- **Response Format**: JSON
- **Authentication**: Bearer Token (JWT)
- **Rate Limit**: 100 requests/minute
- **Max File Size**: 10MB

## 🛠 Technology Stack

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Cache**: Redis
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Validation**: class-validator
- **File Storage**: AWS S3 / Local Storage

## 📞 Support

For questions, issues, or contributions:

- **Email**: isahohieku@gmail.com
- **GitHub Issues**: [Create an issue](https://github.com/isahohieku/contacts-manager/issues)
- **Documentation**: This documentation site

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

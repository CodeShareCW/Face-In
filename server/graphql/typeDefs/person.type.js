const { gql } = require('apollo-server');
module.exports = gql`
  type Person {
    _id: ID!
    firstName: String!
    lastName: String!
    email: String!
    password: String!
    cardID: String!
    profilePictureURL: String
    profilePicturePublicID: String
    createdAt: String
    lastLogin: String
    userLevel: Int!
    token: String
  }

  input personInput {
    firstName: String!
    lastName: String!
    email: String!
    cardID: String!
    password: String!
    confirmPassword: String!
    userLevel: Int!
  }

  extend type Query {
    getPeople: [Person]
    getPerson(personID: ID!): Person!
  }

  extend type Mutation {
    register(personInput: personInput!): Person!
    login(email: String!, password: String!): Person!
    editProfile(
      firstName: String!
      lastName: String!
      cardID: String!
      profilePicture: String
    ): Person!
  }
`;

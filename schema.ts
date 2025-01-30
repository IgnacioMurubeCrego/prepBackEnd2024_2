export const schema = `#graphql

type Contact{
    id: ID!
    name: String!
    phone: String!
    country: String!
    datetime: String!
}

type Query{
  getContacts: [Contact!]!
  getContact(id: ID!): Contact
}

type Mutation{
  addContact(name: String!,phone: String!): Contact! 
  deleteContact(id: ID!): Boolean!
  updateContact(id: ID!,name: String!,phone: String): Contact
}

`;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pub user: RandomUser,
    pub phone_number: String,
    pub iban: String,
    pub credit_card: CreditCard,
    pub random_name: String,
    pub pet: String,
    pub quote: Quote,
    pub joke: Joke,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RandomUser {
    pub name: String,
    pub email: String,
    pub gender: String,
    pub location: String,
    pub picture: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreditCard {
    pub card_number: String,
    pub card_type: String,
    pub expiration_date: String,
    pub cvv: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Quote {
    pub content: String,
    pub author: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Joke {
    pub r#type: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct RandomUserResponse {
    pub results: Vec<RandomUserResult>,
}

#[derive(Debug, Deserialize)]
pub struct RandomUserResult {
    pub name: RandomUserName,
    pub email: String,
    pub gender: String,
    pub location: RandomUserLocation,
    pub picture: RandomUserPicture,
}

#[derive(Debug, Deserialize)]
pub struct RandomUserName {
    pub first: String,
    pub last: String,
}

#[derive(Debug, Deserialize)]
pub struct RandomUserLocation {
    pub city: String,
    pub country: String,
}

#[derive(Debug, Deserialize)]
pub struct RandomUserPicture {
    pub large: String,
}

#[derive(Debug, Deserialize)]
pub struct ZenQuoteResponse {
    pub q: String,
    pub a: String,
}

#[derive(Debug, Deserialize)]
pub struct JokeApiResponse {
    pub category: String,
    pub joke: String,
}

#[derive(Debug, Deserialize)]
pub struct RandommerCreditCardResponse {
    pub r#type: String,
    pub date: String,
    #[serde(rename = "cardNumber")]
    pub card_number: String,
    pub cvv: String,
}
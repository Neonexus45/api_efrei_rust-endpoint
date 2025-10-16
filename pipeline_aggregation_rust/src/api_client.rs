use crate::models::*;
use std::error::Error;

const RANDOMMER_API_KEY: &str = "b4a95ecc867f4c6496b36e35bb43e654";

pub async fn fetch_random_user() -> Result<RandomUser, Box<dyn Error>> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://randomuser.me/api/")
        .send()
        .await?;

    let user_response: RandomUserResponse = response.json().await?;
    let user_result = &user_response.results[0];

    Ok(RandomUser {
        name: format!("{} {}", user_result.name.first, user_result.name.last),
        email: user_result.email.clone(),
        gender: user_result.gender.clone(),
        location: format!("{}, {}", user_result.location.city, user_result.location.country),
        picture: user_result.picture.large.clone(),
    })
}

pub async fn fetch_phone_number() -> Result<String, Box<dyn Error>> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://randommer.io/api/Phone/Generate")
        .header("X-Api-Key", RANDOMMER_API_KEY)
        .query(&[("CountryCode", "FR"),("Quantity", "1")])
        .send()
        .await?;

    let phone_text = response.text().await?;
    let cleaned = phone_text
        .trim_matches('[')
        .trim_matches(']')
        .trim_matches('"');
    Ok(cleaned.to_string())
}

pub async fn fetch_iban() -> Result<String, Box<dyn Error>> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://randommer.io/api/Finance/Iban/FR")
        .header("X-Api-Key", RANDOMMER_API_KEY)
        .send()
        .await?;

    let iban_text = response.text().await?;
    Ok(iban_text.trim_matches('"').to_string())
}

pub async fn fetch_credit_card() -> Result<CreditCard, Box<dyn Error>> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://randommer.io/api/Card")
        .header("X-Api-Key", RANDOMMER_API_KEY)
        .query(&[("type", "visa")])
        .send()
        .await?;

    let card_response: RandommerCreditCardResponse = response.json().await?;

    let year = card_response.date.split('-').next().unwrap_or("2026");
    let month = "12";

    Ok(CreditCard {
        card_number: card_response.card_number,
        card_type: card_response.r#type,
        expiration_date: format!("{}/{}", month, year),
        cvv: card_response.cvv,
    })
}

pub async fn fetch_random_name() -> Result<String, Box<dyn Error>> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://randommer.io/api/Name")
        .header("X-Api-Key", RANDOMMER_API_KEY)
        .query(&[("nameType", "firstname"), ("quantity", "1")])
        .send()
        .await?;

    let name_response: Vec<String> = response.json().await?;
    Ok(name_response[0].clone())
}

pub async fn fetch_pet() -> Result<String, Box<dyn Error>> {
    let client = reqwest::Client::new();
    let form_data = [
        ("animal", "Dog"),
        ("number", "1")
    ];

    let response = client
        .post("https://randommer.io/pet-names")
        .header("X-Requested-With", "XMLHttpRequest")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .form(&form_data)
        .send()
        .await?;

    let pet_text = response.text().await?;
    let cleaned = pet_text
        .trim_matches('[')
        .trim_matches(']')
        .trim_matches('"');
    Ok(cleaned.to_string())
}

pub async fn fetch_quote() -> Result<Quote, Box<dyn Error>> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://zenquotes.io/api/random")
        .send()
        .await?;

    let quote_response: Vec<ZenQuoteResponse> = response.json().await?;
    let quote = &quote_response[0];

    Ok(Quote {
        content: quote.q.clone(),
        author: quote.a.clone(),
    })
}

pub async fn fetch_joke() -> Result<Joke, Box<dyn Error>> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://v2.jokeapi.dev/joke/Programming,Miscellaneous,Pun?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single")
        .send()
        .await?;

    let joke_response: JokeApiResponse = response.json().await?;
    Ok(Joke {
        r#type: joke_response.category,
        content: joke_response.joke,
    })
}
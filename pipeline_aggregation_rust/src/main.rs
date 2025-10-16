mod models;
mod api_client;

use std::error::Error;
use crate::api_client::{fetch_credit_card, fetch_iban, fetch_joke, fetch_pet, fetch_phone_number, fetch_quote, fetch_random_name, fetch_random_user};
use crate::models::UserProfile;

async fn send_to_api(data: &UserProfile) -> Result<(), Box<dyn Error>> {
    let client = reqwest::Client::new();
    let api_url = "http://localhost:3000/api/aggregated/ingest";

    let response = client
        .post(api_url)
        .json(data)
        .send()
        .await?;

    let status = response.status();
    let body = response.text().await?;

    println!("API Response Status: {}", status);
    println!("API Response Body: {}", body);

    if status.is_success() {
        Ok(())
    } else {
        Err(format!("API returned error: {}", status).into())
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {

    let user = fetch_random_user().await?;
    let phone_number = fetch_phone_number().await?;
    let iban = fetch_iban().await?;
    let credit_card = fetch_credit_card().await?;
    let random_name = fetch_random_name().await?;
    let pet = fetch_pet().await?;
    let quote = fetch_quote().await?;
    let joke = fetch_joke().await?;
    let profile =  UserProfile {
        user,
        phone_number,
        iban,
        credit_card,
        random_name,
        pet,
        quote,
        joke,
    };

    match send_to_api(&profile).await {
        Ok(_) => {
            println!("✓ Données envoyées avec succès à l'API");
        }
        Err(e) => {
            eprintln!("✗ Erreur lors de l'envoi à l'API: {}", e);
            eprintln!("→ Sauvegarde en fallback dans user_profile.json");

            let json_output = serde_json::to_string_pretty(&profile)?;
            std::fs::write("user_profile.json", json_output)?;
            println!("✓ Profil sauvegardé dans user_profile.json");
        }
    }

    Ok(())
}

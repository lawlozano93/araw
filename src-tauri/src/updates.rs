use semver::Version;
use serde::{Deserialize, Serialize};

const OWNER: &str = "lawlozano93";
const REPO: &str = "araw";

#[derive(Debug, Deserialize)]
struct GithubRelease {
  tag_name: String,
  html_url: String,
  draft: bool,
  prerelease: bool,
}

#[derive(Debug, Serialize)]
pub struct UpdateCheckResult {
  pub current_version: String,
  pub latest_version: Option<String>,
  pub latest_tag: Option<String>,
  pub release_url: Option<String>,
  pub update_available: bool,
}

fn parse_tag_to_version(tag: &str) -> Option<Version> {
  let trimmed = tag.trim();
  let no_v = trimmed.strip_prefix('v').unwrap_or(trimmed);
  Version::parse(no_v).ok()
}

pub async fn check_github_latest_release() -> Result<UpdateCheckResult, String> {
  let current_version_str = env!("CARGO_PKG_VERSION").to_string();
  let current_version = Version::parse(&current_version_str)
    .map_err(|e| format!("Invalid current version {}: {}", current_version_str, e))?;

  let url = format!(
    "https://api.github.com/repos/{}/{}/releases/latest",
    OWNER, REPO
  );

  let client = reqwest::Client::new();
  let release = client
    .get(url)
    .header(reqwest::header::USER_AGENT, "Araw-Updater/1.0")
    .header(reqwest::header::ACCEPT, "application/vnd.github+json")
    .send()
    .await
    .map_err(|e| format!("Failed to query GitHub releases: {}", e))?
    .error_for_status()
    .map_err(|e| format!("GitHub releases request failed: {}", e))?
    .json::<GithubRelease>()
    .await
    .map_err(|e| format!("Failed to parse GitHub releases response: {}", e))?;

  // Be conservative: don't prompt users about draft/prerelease.
  if release.draft || release.prerelease {
    return Ok(UpdateCheckResult {
      current_version: current_version_str,
      latest_version: None,
      latest_tag: None,
      release_url: None,
      update_available: false,
    });
  }

  let latest_version = parse_tag_to_version(&release.tag_name);
  let update_available = latest_version
    .as_ref()
    .map(|v| v > &current_version)
    .unwrap_or(false);

  Ok(UpdateCheckResult {
    current_version: current_version_str,
    latest_version: latest_version.map(|v| v.to_string()),
    latest_tag: Some(release.tag_name),
    release_url: Some(release.html_url),
    update_available,
  })
}


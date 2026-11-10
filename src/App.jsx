import React, { useState } from 'react';
import './App.css';

const PREFERENCE_OPTIONS = [
  'Assigned parking',
  'Garage parking',
  'In-unit washer and dryer',
  'Pet friendly',
  'Balcony or patio',
  'Gym or fitness center',
  'Dishwasher',
  'Air conditioning',
  'Near public transportation',
  'Two or more bedrooms',
  'No application fee',
  'Elevator',
  'Utilities included',
  'Hardwood flooring',
  'Outdoor space',
  'Secure building entry',
  'Extra storage',
];

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const getAssistantReply = (question, context) => {
  const query = question.toLowerCase();
  const currencyBudget = `$${context.budget.toLocaleString()}`;
  const matches = context.shortlist.filter((item) => item.price <= context.budget);

  if (/live|real|actual|available|book|apply|contact|landlord/.test(query)) {
    return 'I wish I could check that for you, but this is an educational demo—not a real listing service. The apartments and commute estimates are sample data, so availability, policies, and costs can’t be verified here.';
  }
  if (/budget|afford|rent|price|cost|expensive/.test(query)) {
    if (context.shortlist.length === 0) {
      return `Your monthly budget is ${currencyBudget}. You can turn on “Only show apartments within my budget” to hide sample options above that amount. Once you run a search, I can help compare the example rents.`;
    }
    return `Your monthly budget is ${currencyBudget}, and ${matches.length} of ${context.shortlist.length} sample ${context.shortlist.length === 1 ? 'option is' : 'options are'} at or below it${context.withinBudgetOnly ? '. Your budget filter is on' : ''}. These are example prices, not real listings.`;
  }
  if (/commute|travel|drive|transit|minutes|time/.test(query)) {
    return `You’ve set a maximum commute of ${context.commuteMax} minutes. The times in the shortlist are sample estimates—not live route calculations. You can ask me to change your commute limit, too.`;
  }
  if (/pet|dog|cat|animal/.test(query)) {
    return context.pets
      ? 'Pet-friendly options are enabled 🐾. The demo prioritizes sample homes marked pet friendly, but a real property’s pet rules would need to be confirmed with its manager.'
      : 'You don’t currently require a pet-friendly home. I can turn that on if you’d like—or you can use the toggle on the Criteria tab.';
  }
  if (/preference|parking|laundry|washer|dryer|bedroom|bedrooms|amenit/.test(query)) {
    return context.preferences.length
      ? `Your must-haves are ${context.preferences.join(', ')}. The demo gives a higher score to sample homes that match them. Want to add another? Just tell me which amenity.`
      : 'You haven’t picked any extra must-haves yet. I can add one for you—try “I’d like garage parking.” Or choose from the dropdown on the Criteria tab.';
  }
  if (/shortlist|result|match|recommend|best|which apartment/.test(query)) {
    if (context.shortlist.length === 0) {
      return 'Your shortlist is still empty. I can take you to your criteria, or you can ask me to run the search when you’re ready.';
    }
    const shown = context.withinBudgetOnly ? matches : context.shortlist;
    if (shown.length === 0) {
      return `None of the sample homes fit your ${currencyBudget} limit right now. You can raise your budget or turn off the budget filter to see every example.`;
    }
    const topMatch = shown[0];
    if (/compare|all|difference/.test(query) && shown.length > 1) {
      const comparisons = shown
        .map((item) => `${item.title}: $${item.price.toLocaleString()}/mo, ${item.commuteTimeMin} min sample commute, ${item.finalScore}/100 match`)
        .join('; ');
      return `Here’s a quick side-by-side: ${comparisons}. Scores are demo rankings, and the homes and commute estimates are illustrative—not real listings.`;
    }
    return `Your top-ranked visible example is “${topMatch.title}” at $${topMatch.price.toLocaleString()}/month, with a ${topMatch.commuteTimeMin}-minute sample commute and a ${topMatch.finalScore}/100 match score. It ranks highest based on the demo criteria; it isn’t a real available apartment.`;
  }
  if (/improve|next step|what should|suggest|recommendation|missing/.test(query)) {
    const tips = [];
    if (context.preferences.length === 0) tips.push('add a must-have amenity');
    if (!context.withinBudgetOnly) tips.push('turn on the within-budget filter');
    if (context.commuteMax >= 45) tips.push('tighten the commute limit if travel time is important');
    if (context.pets) tips.push('confirm pet policies when considering real homes');
    if (tips.length === 0) tips.push('compare the sample matches and adjust any criteria that feel too restrictive');
    return `A couple of useful next steps: ${tips.join('; ')}. You can change your criteria here at any time.`;
  }
  if (/criteria|my search|what have i|what did i/.test(query)) {
    const mustHaves = context.preferences.length ? context.preferences.join(', ') : 'none added yet';
    return `Here’s your current search: near ${context.location || 'no location entered'}, up to ${currencyBudget}/month, commute up to ${context.commuteMax} minutes, ${context.pets ? 'pet friendly preferred' : 'no pet requirement'}, and must-haves: ${mustHaves}. The budget filter is ${context.withinBudgetOnly ? 'on' : 'off'}.`;
  }
  if (/how|work|agent|reason|trace|search/.test(query)) {
    return 'Here’s the short version: the agent reads your location, creates a few example homes, assigns sample commute times, then ranks them using your budget, commute limit, pet preference, and must-haves. The Reasoning Trace shows each step. Want me to help tune any of those criteria?';
  }
  if (/help|what can|do you/.test(query)) {
    return 'I can help with your budget, commute, pets, must-have amenities, and sample matches. You can ask a question or say things like “Set my budget to $2,200,” “I need garage parking,” or “Compare my matches.”';
  }
  return 'I’m here to make your search easier. Ask about your criteria or shortlist, or tell me what you’d like to change—for example, “Set my budget to $2,200.” This demo uses sample homes, not real apartment availability.';
};

export default function ApartmentHunterApp() {
  const [budget, setBudget] = useState(2500);
  const [location, setLocation] = useState('1000 Morris Avenue, Union, NJ');
  const [commuteMax, setCommuteMax] = useState(30);
  const [withinBudgetOnly, setWithinBudgetOnly] = useState(false);
  const [pets, setPets] = useState(true);
  const [preferences, setPreferences] = useState([]);
  const [preferenceToAdd, setPreferenceToAdd] = useState('');
  const [agentState, setAgentState] = useState('IDLE');
  const [logs, setLogs] = useState([]);
  const [shortlist, setShortlist] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [errorMessage, setErrorMessage] = useState('');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I’m your Apartment Hunter guide 👋 I can explain your search, compare sample matches, or update your criteria. What would be helpful?',
      suggestions: ['Review my criteria', 'Compare my matches', 'What should I do next?'],
    },
  ]);

  const addLog = (step, title, details) => {
    setLogs((previous) => [
      ...previous,
      {
        id: `${Date.now()}-${Math.random()}`,
        step,
        title,
        details,
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const geocodeAddress = async (addressQuery) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(addressQuery)}`,
      );
      if (!response.ok) {
        throw new Error(`Geocoding request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data.length > 0) {
        const address = data[0].address || {};
        return {
          displayName: data[0].display_name,
          lat: Number.parseFloat(data[0].lat),
          lon: Number.parseFloat(data[0].lon),
          road: address.road || address.street || 'Main St',
          suburb:
            address.suburb ||
            address.neighbourhood ||
            address.city_district ||
            address.town ||
            address.city ||
            'Local Area',
          city: address.city || address.town || address.village || address.county || 'Region',
          usedDemoFallback: false,
        };
      }
    } catch (error) {
      console.warn('Geocoding request failed; using the demo fallback location.', error);
    }

    return {
      displayName: addressQuery,
      lat: 40.6845,
      lon: -74.2365,
      road: 'Avenue Corridor',
      suburb: addressQuery.split(',')[0] || 'Local Area',
      city: 'Target Zone',
      usedDemoFallback: true,
    };
  };

  const runAgent = async () => {
    const targetLocation = location.trim();
    if (!targetLocation) {
      setErrorMessage('Enter a target address or landmark to run the demo.');
      return;
    }

    setErrorMessage('');
    setAgentState('RUNNING');
    setLogs([]);
    setShortlist([]);
    setActiveTab('console');

    try {
      addLog(1, 'Calling Tool: geocode_and_parse_address', { inputQuery: targetLocation });
      const geoData = await geocodeAddress(targetLocation);
      addLog(1, 'Tool Output: geocode_and_parse_address', {
        resolvedAddress: geoData.displayName,
        extractedRoad: geoData.road,
        extractedSuburb: geoData.suburb,
        latitude: geoData.lat,
        longitude: geoData.lon,
        status: geoData.usedDemoFallback ? 'DEMO_FALLBACK' : 'SUCCESS',
      });

      addLog(2, 'Calling Tool: search_listings_radius', {
        center: geoData.displayName,
        radiusMiles: 4,
        maxPrice: budget,
      });
      await wait(600);

      const dynamicListings = [
        {
          id: 1,
          title: `Modern 1BR Steps from ${geoData.road}`,
          address: `150 ${geoData.road}, ${geoData.suburb}, ${geoData.city}`,
          lat: geoData.lat + 0.002,
          lon: geoData.lon + 0.002,
          price: Math.max(1300, budget - 200),
          sqft: 680,
          beds: 1,
          baths: 1,
          commuteTimeMin: 5,
          petPolicy: pets ? 'Pet friendly (cats & dogs)' : 'Pet policy not prioritized',
          description: `A bright sample home near ${geoData.road}, with oversized windows and convenient access to local transit.`,
          amenities: [
            'Pet friendly',
            'Air conditioning',
            'Near public transportation',
            'Dishwasher',
            'Hardwood flooring',
          ],
          score: 97,
          matchReason: `Close to your target area with a short 5-minute sample commute.`,
        },
        {
          id: 2,
          title: `The Residences at ${geoData.suburb} Center`,
          address: `42 ${geoData.suburb} Plaza, ${geoData.city}`,
          lat: geoData.lat - 0.006,
          lon: geoData.lon - 0.005,
          price: Math.max(1200, budget - 350),
          sqft: 820,
          beds: 2,
          baths: 1,
          commuteTimeMin: 14,
          petPolicy: pets ? 'Pets welcome (sample policy)' : 'Pet policy not prioritized',
          description: `A spacious sample 2-bedroom home with in-unit laundry and secure building access.`,
          amenities: [
            'In-unit washer and dryer',
            'Two or more bedrooms',
            'Secure building entry',
            'Elevator',
            'Extra storage',
            'Pet friendly',
          ],
          score: 91,
          matchReason: `A value-focused sample option in ${geoData.suburb} with a 14-minute sample commute.`,
        },
        {
          id: 3,
          title: `The ${geoData.city} Corner Lofts`,
          address: `300 Executive Pkwy, ${geoData.city}`,
          lat: geoData.lat + 0.012,
          lon: geoData.lon - 0.01,
          price: budget + 120,
          sqft: 1050,
          beds: 2,
          baths: 2,
          commuteTimeMin: 23,
          petPolicy: 'Pets welcome (sample policy)',
          description: `A sample loft with fitness amenities, garage parking, and a private balcony.`,
          amenities: [
            'Garage parking',
            'Assigned parking',
            'Balcony or patio',
            'Gym or fitness center',
            'Outdoor space',
            'Pet friendly',
          ],
          score: 82,
          matchReason: `A sample home with extra space and amenities near ${geoData.city}.`,
        },
      ];

      addLog(
        2,
        'Tool Output: search_listings_radius',
        `Generated ${dynamicListings.length} illustrative properties near ${geoData.road}, ${geoData.city}. These are demo data, not live listings.`,
      );

      addLog(3, 'Calling Tool: calculate_transit_matrix', {
        destination: geoData.displayName,
        mode: 'public_transit_and_drive',
      });
      await wait(600);
      addLog(3, 'Tool Output: calculate_transit_matrix', {
        note: 'Sample commute estimates used for this educational demo.',
      });

      addLog(4, 'Calling Tool: score_and_rank_apartments', {
        budget,
        commuteMax,
        pets,
        preferences,
      });
      await wait(400);

      const scored = dynamicListings
        .map((item) => {
          let scoreAdjustment = 0;
          const notes = [item.matchReason];

          if (item.commuteTimeMin > commuteMax) {
            scoreAdjustment -= 15;
            notes.push(`Sample commute (${item.commuteTimeMin} min) exceeds your target.`);
          }
          if (item.price > budget) {
            scoreAdjustment -= 10;
            notes.push(`Sample rent is $${item.price - budget} above your monthly budget.`);
          }
          if (pets && !item.amenities.includes('Pet friendly')) {
            scoreAdjustment -= 12;
            notes.push('Pet-friendly status is not confirmed in this sample.');
          }

          const matchedPreferences = preferences.filter((preference) =>
            item.amenities.includes(preference),
          );
          const missingPreferences = preferences.filter(
            (preference) => !item.amenities.includes(preference),
          );
          scoreAdjustment += matchedPreferences.length * 3;
          scoreAdjustment -= missingPreferences.length * 4;
          if (preferences.length > 0) {
            notes.push(
              `Matches ${matchedPreferences.length} of ${preferences.length} selected preferences.`,
            );
          }

          return {
            ...item,
            finalScore: Math.max(40, Math.min(100, item.score + scoreAdjustment)),
            matchedPreferences,
            dynamicNotes: notes.join(' '),
          };
        })
        .sort((first, second) => second.finalScore - first.finalScore);

      setShortlist(scored);
      setAgentState('COMPLETED');
      addLog(4, 'Agent Finished', `Demo shortlist generated for "${targetLocation}".`);
      setActiveTab('shortlist');
    } catch (error) {
      console.error('The apartment search demo could not complete.', error);
      setAgentState('ERROR');
      setErrorMessage('The demo could not complete. Please try running the agent again.');
      addLog(0, 'Agent Error', error instanceof Error ? error.message : String(error));
    }
  };

  const addPreference = () => {
    if (!preferenceToAdd || preferences.includes(preferenceToAdd)) {
      return;
    }
    setPreferences((previous) => [...previous, preferenceToAdd]);
    setPreferenceToAdd('');
  };

  const removePreference = (preferenceToRemove) => {
    setPreferences((previous) => previous.filter((item) => item !== preferenceToRemove));
  };

  const sendChatMessage = (message = chatInput) => {
    const question = message.trim();
    if (!question) {
      return;
    }

    const query = question.toLowerCase();
    const context = {
      budget,
      commuteMax,
      pets,
      preferences,
      shortlist,
      withinBudgetOnly,
      location,
    };
    let reply;
    let action;
    const requestedBudget = query.match(
      /\b(?:budget|monthly rent|spend|pay)\b.{0,24}?\$?\s*(\d[\d,]*)/i,
    );
    const requestedCommute = query.match(
      /\b(?:commute|travel)(?:\s+time|\s+limit)?\s*(?:to|of|at|under|up to|around)?\s*(\d{1,2})\s*(?:minutes?|mins?)?\b/i,
    );
    const requestedPreference = PREFERENCE_OPTIONS.find((preference) =>
      query.includes(preference.toLowerCase()),
    );
    const asksToAddPreference =
      /\b(add|want|need|include|prefer|must have|looking for)\b/.test(query);
    const asksToSetBudget =
      /\b(set|change|update|make|increase|decrease|lower|raise)\b/.test(query) &&
      /\b(budget|monthly|rent|spend|pay)\b/.test(query);
    const asksToSetCommute =
      /\b(set|change|update|make|increase|decrease|lower|raise)\b/.test(query) &&
      /\b(commute|travel)\b/.test(query);
    const asksForShortlist = /\b(show|open|go to|take me to|view)\b.*\b(shortlist|results|matches)\b/.test(query);
    const asksToRunSearch = /\b(run|start|begin)\b.*\b(search|agent)\b/.test(query);
    const turnsOffPets = /\b(no|not|without|don't|do not|turn off|disable)\b.{0,25}\b(pet|pets|dog|cat|animal)\b/.test(query);
    const turnsOnPets = /\b(pet|pets|dog|cat|animal)\b.{0,25}\b(yes|friendly|allow|required|need|include|on)\b/.test(query);

    if (requestedBudget && asksToSetBudget) {
      const newBudget = Number(requestedBudget[1].replaceAll(',', ''));
      if (newBudget >= 1000 && newBudget <= 5000) {
        setBudget(newBudget);
        reply = `Done! I’ve set your monthly budget to $${newBudget.toLocaleString()}. Want me to rerun the sample search with that limit?`;
      } else {
        reply = 'The budget slider currently supports $1,000–$5,000 per month. Choose a value in that range and I’ll update it for you.';
      }
    } else if (requestedCommute && asksToSetCommute) {
      const newCommute = Number(requestedCommute[1]);
      if (newCommute >= 5 && newCommute <= 60) {
        setCommuteMax(newCommute);
        reply = `Got it—your maximum commute is now ${newCommute} minutes. Run the sample search again to rerank the options using this limit.`;
      } else {
        reply = 'The commute setting can be between 5 and 60 minutes. Tell me a number in that range and I’ll update it.';
      }
    } else if (turnsOffPets) {
      setPets(false);
      reply = 'Done—I’ve removed the pet-friendly requirement. You can turn it back on whenever you like.';
    } else if (turnsOnPets) {
      setPets(true);
      reply = 'Absolutely—I’ve turned on the pet-friendly preference. Remember to verify real properties’ pet rules directly.';
    } else if (requestedPreference && asksToAddPreference) {
      if (preferences.includes(requestedPreference)) {
        reply = `${requestedPreference} is already on your must-have list. Want to add or change anything else?`;
      } else {
        setPreferences((previous) => [...previous, requestedPreference]);
        reply = `Added ${requestedPreference} to your must-haves. I’ll use it when ranking the sample apartments the next time you run a search.`;
      }
    } else if (asksToSetBudget && !requestedBudget) {
      reply = 'Sure—what monthly budget would you like? For example, “Set my budget to $2,200.”';
    } else if (asksToSetCommute && !requestedCommute) {
      reply = 'What commute limit would you prefer? The setting can be 5–60 minutes.';
    } else if (/\b(what|which|show|tell me).*\b(criteria|search|looking for)\b/.test(query)) {
      reply = getAssistantReply('my criteria', context);
      action = { label: 'Go to criteria', type: 'criteria' };
    } else if (asksForShortlist) {
      setActiveTab('shortlist');
      reply = context.shortlist.length
        ? 'Here’s your sample shortlist. I can also compare the options or explain why one ranked higher.'
        : 'Your shortlist is empty so far. Run the sample search first and I’ll help you compare the results.';
      action = { label: context.shortlist.length ? 'View shortlist' : 'Go to criteria', type: context.shortlist.length ? 'shortlist' : 'criteria' };
    } else if (asksToRunSearch) {
      reply = 'On it—I’m running the sample apartment search now. The results are illustrative, not live listings.';
      action = { label: 'Run sample search', type: 'run-search' };
    } else {
      reply = getAssistantReply(question, context);
    }

    setChatMessages((previous) => [
      ...previous,
      { id: `${Date.now()}-user`, role: 'user', text: question },
      {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        text: reply,
        action,
        suggestions: ['Review my criteria', 'Compare my matches', 'What should I do next?'],
      },
    ]);
    setChatInput('');
  };

  const runChatAction = (action) => {
    if (action === 'criteria') {
      setActiveTab('dashboard');
    } else if (action === 'shortlist') {
      setActiveTab('shortlist');
    } else if (action === 'run-search') {
      void runAgent();
    }
  };

  const availablePreferences = PREFERENCE_OPTIONS.filter(
    (preference) => !preferences.includes(preference),
  );
  const visibleShortlist = withinBudgetOnly
    ? shortlist.filter((item) => item.price <= budget)
    : shortlist;
  const latestAssistantMessage = [...chatMessages]
    .reverse()
    .find((message) => message.role === 'assistant');

  return (
    <main className="app-shell">
      <div className="app-container">
        <header className="topbar">
          <a className="brand" href="#criteria" onClick={() => setActiveTab('dashboard')}>
            <span className="brand-mark" aria-hidden="true">⌂</span>
            <span className="brand-copy">
              <span className="brand-name">Apartment Hunter</span>
              <span className="brand-caption">Your apartment search, thoughtfully organized</span>
            </span>
          </a>
          <nav className="tab-nav" aria-label="Main navigation">
            <button
              className={`tab-button ${activeTab === 'dashboard' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
              type="button"
            >
              Criteria
            </button>
            <button
              className={`tab-button ${activeTab === 'console' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('console')}
              type="button"
            >
              Reasoning Trace <span className="tab-count">{logs.length}</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'shortlist' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('shortlist')}
              type="button"
            >
              Shortlist <span className="tab-count">{visibleShortlist.length}</span>
            </button>
          </nav>
        </header>

        <section className="welcome-row">
          <div>
            <p className="eyebrow">A smarter way to explore</p>
            <h1>Find a place that feels like yours.</h1>
            <p className="welcome-copy">
              Set your search criteria and let the demo agent show how an apartment search can
              reason through your priorities.
            </p>
          </div>
          <div className="demo-label">
            <span className="demo-dot" />
            Educational demo · Sample listings
          </div>
        </section>

        {activeTab === 'dashboard' && (
          <section className="dashboard-grid" id="criteria">
            <div className="card criteria-card">
              <div className="section-heading">
                <span className="section-icon blue-icon" aria-hidden="true">⌕</span>
                <div>
                  <h2>Search criteria</h2>
                  <p>Tell us what matters in your next home.</p>
                </div>
              </div>

              <div className="form-field location-field">
                <label htmlFor="target-location">Target address or location</label>
                <div className="input-with-icon">
                  <span aria-hidden="true">⌖</span>
                  <input
                    id="target-location"
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="e.g. 1000 Morris Avenue, Union, NJ"
                  />
                </div>
                <span className="field-hint">A landmark, street address, or neighborhood works.</span>
              </div>

              <div className="slider-field">
                <div className="slider-label-row">
                  <label htmlFor="monthly-budget">Monthly budget</label>
                  <output htmlFor="monthly-budget" className="range-value">
                    ${budget.toLocaleString()} <span>/ month</span>
                  </output>
                </div>
                <input
                  id="monthly-budget"
                  className="range-input"
                  type="range"
                  min="1000"
                  max="5000"
                  step="100"
                  value={budget}
                  onChange={(event) => setBudget(Number(event.target.value))}
                />
                <div className="range-limits"><span>$1,000</span><span>$5,000+</span></div>
              </div>

              <label className="budget-filter" htmlFor="within-budget-only">
                <input
                  id="within-budget-only"
                  type="checkbox"
                  checked={withinBudgetOnly}
                  onChange={(event) => setWithinBudgetOnly(event.target.checked)}
                />
                <span className="budget-checkmark" aria-hidden="true">✓</span>
                <span className="budget-filter-copy">
                  <strong>Only show apartments within my budget</strong>
                  <small>Hide options priced above ${budget.toLocaleString()} per month</small>
                </span>
              </label>

              <div className="slider-field">
                <div className="slider-label-row">
                  <label htmlFor="commute-time">Maximum commute</label>
                  <output htmlFor="commute-time" className="range-value">
                    {commuteMax} <span>minutes</span>
                  </output>
                </div>
                <input
                  id="commute-time"
                  className="range-input"
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={commuteMax}
                  onChange={(event) => setCommuteMax(Number(event.target.value))}
                />
                <div className="range-limits"><span>5 min</span><span>60 min</span></div>
              </div>

              <label className="pet-toggle" htmlFor="pet-friendly">
                <span className="pet-toggle-copy">
                  <span className="pet-icon" aria-hidden="true">♡</span>
                  <span>
                    <strong>Pet-friendly home</strong>
                    <small>Include pet-friendly options in my search</small>
                  </span>
                </span>
                <input
                  id="pet-friendly"
                  type="checkbox"
                  checked={pets}
                  onChange={(event) => setPets(event.target.checked)}
                />
                <span className="toggle-track" aria-hidden="true" />
              </label>

              <div className="form-field preference-field">
                <label htmlFor="preference-select">Apartment preferences</label>
                <p className="field-description">Add as many must-haves as you like.</p>
                <div className="preference-controls">
                  <select
                    id="preference-select"
                    value={preferenceToAdd}
                    onChange={(event) => setPreferenceToAdd(event.target.value)}
                  >
                    <option value="">Choose a preference...</option>
                    {availablePreferences.map((preference) => (
                      <option key={preference} value={preference}>{preference}</option>
                    ))}
                  </select>
                  <button
                    className="button button-secondary add-button"
                    type="button"
                    onClick={addPreference}
                    disabled={!preferenceToAdd}
                  >
                    <span aria-hidden="true">＋</span> Add preference
                  </button>
                </div>
                {preferences.length > 0 ? (
                  <ul className="preference-list">
                    {preferences.map((preference) => (
                      <li key={preference}>
                        <span className="checkmark" aria-hidden="true">✓</span>
                        <span>{preference}</span>
                        <button
                          className="remove-preference"
                          type="button"
                          onClick={() => removePreference(preference)}
                          aria-label={`Remove ${preference}`}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-preferences">No extra preferences added yet.</p>
                )}
              </div>

              {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}

              <button
                className="button button-primary run-button"
                onClick={runAgent}
                disabled={agentState === 'RUNNING'}
                type="button"
              >
                {agentState === 'RUNNING' ? (
                  <><span className="button-spinner" /> Finding your matches...</>
                ) : (
                  <>Run search <span aria-hidden="true">→</span></>
                )}
              </button>
              <p className="button-footnote">The agent uses illustrative data for demonstration only.</p>
            </div>

            <aside className="dashboard-aside">
              <div className="card summary-card">
                <div className="section-heading compact-heading">
                  <span className="section-icon teal-icon" aria-hidden="true">✓</span>
                  <div>
                    <h2>Your search at a glance</h2>
                    <p>Criteria are updated as you make changes.</p>
                  </div>
                </div>
                <dl className="criteria-summary">
                  <div>
                    <dt>Looking near</dt>
                    <dd>{location.trim() || 'Add a location'}</dd>
                  </div>
                  <div className="summary-pair">
                    <div><dt>Monthly budget</dt><dd>${budget.toLocaleString()}</dd></div>
                    <div><dt>Commute</dt><dd>Up to {commuteMax} min</dd></div>
                  </div>
                  <div>
                    <dt>Budget matching</dt>
                    <dd>{withinBudgetOnly ? 'Showing within-budget options only' : 'Over-budget options are still shown'}</dd>
                  </div>
                  <div>
                    <dt>Pets</dt>
                    <dd>{pets ? 'Pet-friendly preferred' : 'No pet preference'}</dd>
                  </div>
                  <div>
                    <dt>Preferences</dt>
                    {preferences.length ? (
                      <ul className="summary-preferences">
                        {preferences.map((preference) => <li key={preference}>{preference}</li>)}
                      </ul>
                    ) : <dd>No additional preferences</dd>}
                  </div>
                </dl>
              </div>

              <div className="card how-card">
                <p className="eyebrow">Behind the scenes</p>
                <h2>How the demo agent works</h2>
                <ol className="workflow-list">
                  <li><span>01</span><div><strong>Understand your area</strong><small>Resolve the location and its context.</small></div></li>
                  <li><span>02</span><div><strong>Explore sample homes</strong><small>Create illustrative nearby options.</small></div></li>
                  <li><span>03</span><div><strong>Estimate the commute</strong><small>Compare sample travel times.</small></div></li>
                  <li><span>04</span><div><strong>Rank your matches</strong><small>Weigh budget and preferences.</small></div></li>
                </ol>
              </div>
              <div className="demo-note">
                <span aria-hidden="true">ⓘ</span>
                <p><strong>Demo, not a listing service.</strong> Results are generated examples and aren't real or available apartments.</p>
              </div>
            </aside>
          </section>
        )}

        {activeTab === 'console' && (
          <section className="card content-card">
            <div className="content-heading">
              <div>
                <p className="eyebrow">Agent activity</p>
                <h2>Reasoning trace</h2>
                <p className="section-subtitle">Follow each step of the educational agent workflow.</p>
              </div>
              <span className={`status-pill status-${agentState.toLowerCase()}`}>
                <span className="status-dot" /> {agentState}
              </span>
            </div>
            {logs.length ? (
              <div className="trace-list">
                {logs.map((log) => (
                  <article className="trace-item" key={log.id}>
                    <div className="trace-step">{log.step || '!'}</div>
                    <div className="trace-content">
                      <div className="trace-title-row">
                        <h3>{log.title}</h3>
                        <time>{log.time}</time>
                      </div>
                      <pre>{typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}</pre>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-state-icon" aria-hidden="true">⌁</span>
                <h3>Your agent trace will appear here</h3>
                <p>Run a search to see how the demo processes your criteria step by step.</p>
                <button className="button button-primary" type="button" onClick={() => setActiveTab('dashboard')}>
                  Set your criteria
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'shortlist' && (
          <section className="card content-card">
            <div className="content-heading shortlist-heading">
              <div>
                <p className="eyebrow">Curated for your criteria</p>
                <h2>Your sample shortlist</h2>
                <p className="section-subtitle">
                  Example results near <strong>{location.trim() || 'your target area'}</strong>
                </p>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setActiveTab('dashboard')}
              >
                Edit criteria
              </button>
            </div>
            <div className="shortlist-disclaimer">
              Sample results for educational demonstration only — not real apartment listings.
            </div>
            <label className="budget-filter shortlist-budget-filter" htmlFor="within-budget-only-shortlist">
              <input
                id="within-budget-only-shortlist"
                type="checkbox"
                checked={withinBudgetOnly}
                onChange={(event) => setWithinBudgetOnly(event.target.checked)}
              />
              <span className="budget-checkmark" aria-hidden="true">✓</span>
              <span className="budget-filter-copy">
                <strong>Only show apartments within my budget</strong>
                <small>Monthly limit: ${budget.toLocaleString()}</small>
              </span>
              <span className="budget-result-count">
                {visibleShortlist.length} of {shortlist.length} shown
              </span>
            </label>
            {visibleShortlist.length ? (
              <div className="listing-grid">
                {visibleShortlist.map((item, index) => (
                  <article className="listing-card" key={item.id}>
                    <div className={`listing-art listing-art-${item.id}`}>
                      <span className="listing-rank">#{index + 1} match</span>
                      <span className="listing-score">{item.finalScore}<small>/100</small></span>
                      <span className="building-illustration" aria-hidden="true">⌂</span>
                    </div>
                    <div className="listing-body">
                      <div className="listing-title-row">
                        <h3>{item.title}</h3>
                        <span className="listing-price">${item.price.toLocaleString()}<small>/mo</small></span>
                      </div>
                      <p className="listing-address"><span aria-hidden="true">⌖</span> {item.address}</p>
                      <p className="listing-description">{item.description}</p>
                      <div className="listing-stats">
                        <span>{item.beds} {item.beds === 1 ? 'bed' : 'beds'}</span>
                        <span>{item.baths} {item.baths === 1 ? 'bath' : 'baths'}</span>
                        <span>{item.sqft.toLocaleString()} sqft</span>
                        <span>{item.commuteTimeMin} min commute</span>
                      </div>
                      <p className={`budget-status ${item.price <= budget ? 'is-within-budget' : 'is-over-budget'}`}>
                        <span aria-hidden="true">{item.price <= budget ? '✓' : '!'}</span>
                        {item.price <= budget
                          ? 'Within your monthly budget'
                          : `Over budget by $${(item.price - budget).toLocaleString()}/mo`}
                      </p>
                      <div className="amenity-list">
                        {item.amenities.slice(0, 4).map((amenity) => (
                          <span className="amenity-chip" key={amenity}>{amenity}</span>
                        ))}
                      </div>
                      {item.matchedPreferences.length > 0 && (
                        <p className="matched-preferences">
                          <span aria-hidden="true">✓</span> Matches: {item.matchedPreferences.join(', ')}
                        </p>
                      )}
                      <div className="match-reason">
                        <strong>Why it matched</strong>
                        <p>{item.dynamicNotes}</p>
                      </div>
                      <p className="sample-location">Demo coordinates: {item.lat.toFixed(3)}, {item.lon.toFixed(3)}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-state-icon" aria-hidden="true">{shortlist.length ? '$' : '⌂'}</span>
                <h3>{shortlist.length ? 'No options within this budget' : 'No sample results yet'}</h3>
                <p>
                  {shortlist.length
                    ? `None of the sample apartments are at or below $${budget.toLocaleString()} per month. Raise your budget or turn off the filter to see all results.`
                    : 'Set your criteria and run the agent to generate a demo shortlist.'}
                </p>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => {
                    if (shortlist.length) {
                      setWithinBudgetOnly(false);
                    } else {
                      setActiveTab('dashboard');
                    }
                  }}
                >
                  {shortlist.length ? 'Show all sample results' : 'Start a search'}
                </button>
              </div>
            )}
          </section>
        )}

        <footer className="page-footer">
          <span>Apartment Hunter Agent</span>
          <span>Educational demonstration · Not a real estate listing service</span>
        </footer>
      </div>
      <aside className="chat-assistant" aria-label="Apartment Hunter assistant">
        {assistantOpen && (
          <section className="chat-panel" aria-label="Chat with Apartment Hunter">
            <header className="chat-header">
              <span className="chat-avatar" aria-hidden="true">✦</span>
              <div className="chat-header-copy">
                <strong>Apartment Hunter Guide</strong>
                <span><i /> Demo assistant</span>
              </div>
              <button
                className="chat-close"
                type="button"
                onClick={() => setAssistantOpen(false)}
                aria-label="Close chat"
              >
                ×
              </button>
            </header>
            <div className="chat-messages" aria-live="polite">
              {chatMessages.map((message) => (
                <div className={`chat-message ${message.role}`} key={message.id}>
                  {message.role === 'assistant' && <span className="message-avatar" aria-hidden="true">✦</span>}
                  <div className="chat-message-content">
                    <p>{message.text}</p>
                    {message.action && (
                      <button
                        className="chat-action"
                        type="button"
                        onClick={() => runChatAction(message.action.type)}
                      >
                        {message.action.label} <span aria-hidden="true">→</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {latestAssistantMessage?.suggestions && (
                <div className="chat-suggestions" aria-label="Suggested questions">
                  {latestAssistantMessage.suggestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() => sendChatMessage(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <form
              className="chat-composer"
              onSubmit={(event) => {
                event.preventDefault();
                sendChatMessage();
              }}
            >
              <input
                aria-label="Your message"
                placeholder="Ask about your apartment search..."
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
              />
              <button type="submit" disabled={!chatInput.trim()} aria-label="Send message">
                ↑
              </button>
            </form>
            <p className="chat-disclaimer">Demo guide · Replies use your current search and sample data.</p>
          </section>
        )}
        <button
          className={`chat-launcher ${assistantOpen ? 'is-open' : ''}`}
          type="button"
          onClick={() => setAssistantOpen((previous) => !previous)}
          aria-expanded={assistantOpen}
          aria-label={assistantOpen ? 'Close Apartment Hunter assistant' : 'Chat with Apartment Hunter assistant'}
        >
          <span aria-hidden="true">{assistantOpen ? '×' : '✦'}</span>
          {!assistantOpen && <span className="launcher-label">Ask Apartment Hunter</span>}
        </button>
      </aside>
    </main>
  );
}

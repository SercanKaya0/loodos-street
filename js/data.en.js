/* Loodos Street verisi: playground.loodos.com katalog JSON'larından üretildi (tools/gen.py). */
window.STREET_EN = {
 "sectors": [
  {
   "id": "ret",
   "name": "Retail & e-commerce",
   "color": "#1AB0BA",
   "intro": "From super apps to loyalty, marketplaces to B2B commerce: work that joins the store and the screen in one flow."
  },
  {
   "id": "tel",
   "name": "Telecom",
   "color": "#5D5DF7",
   "intro": "From a consumer app serving millions of subscribers to the employee experience."
  },
  {
   "id": "avi",
   "name": "Aviation",
   "color": "#2F8FE0",
   "intro": "From the passenger app to staff travel and AI-driven passenger service."
  },
  {
   "id": "fin",
   "name": "Finance & payments",
   "color": "#2E9E6A",
   "intro": "Embedded finance, licensed payment flows and anomaly detection on transaction data."
  },
  {
   "id": "fnb",
   "name": "Food & beverage",
   "color": "#D98E04",
   "intro": "Ordering, payment and subscriptions: work that moves a daily coffee habit into the app."
  },
  {
   "id": "ind",
   "name": "Industry, energy & manufacturing",
   "color": "#7C8A99",
   "intro": "From the factory floor to field operations, energy subscriptions to technology centres: apps that make work simpler for staff and customers."
  },
  {
   "id": "life",
   "name": "Sport, health & culture",
   "color": "#D6457A",
   "intro": "Gamification, subscriptions and content: consumer apps that build communities."
  },
  {
   "id": "mob",
   "name": "Mobility & accessibility",
   "color": "#9B6BF0",
   "intro": "Apps that talk to hardware: from Bluetooth scooter control to a smart cane for blind and low-vision people."
  }
 ],
 "companies": [
  {
   "id": "a101",
   "name": "A101",
   "sector": "ret",
   "logo": null,
   "projects": [
    {
     "key": "A101 SuperApp",
     "app": "SuperApp",
     "sub": "Discount grocery super app",
     "d": "Kapıda, Ekstra and Hadi in one app: express and scheduled delivery, an online store and a loyalty programme.",
     "metrics": [
      [
       "13,000+",
       "stores with POS integration"
      ],
      [
       "Week 1",
       "in the “Most Popular Apps” list"
      ]
     ],
     "when": null,
     "ctx": "A101 operates over 13,000 stores across Turkey, serving millions of customers every day. As expectations shifted to mobile-first, it needed a complete digital retail platform matching the scale of its physical network.",
     "need": "Bring three distinct experiences into one app: fast delivery across 13,000+ stores, planned shopping that respects how Turkish households buy groceries, and a loyalty programme that works at the register. Shared architecture and a zero-failure launch were required.",
     "approach": "A modern frontend with server-side rendering for faster loads on mid-range devices. Production-tested SDK modules for loyalty, campaigns, deep linking and notifications. POS integration treated as a first-class concern: scan, earn and redeem at checkout in real time.",
     "features": [
      [
       "Kapıda: fast and scheduled delivery",
       "Express and planned delivery with product discovery, real-time availability, basket management, scheduling and payment."
      ],
      [
       "Ekstra: planned shopping",
       "A dedicated weekly shopping journey with category browsing, list building and planned promotions."
      ],
      [
       "Hadi: loyalty programme",
       "Punch cards, balance accumulation and personalised campaigns, with real-time scan, earn and redeem at checkout across 13,000+ stores."
      ],
      [
       "Unified SuperApp architecture",
       "Three modules on one framework with shared auth, payments, notifications and data flows, so the customer sees a single app."
      ]
     ],
     "tech": [
      "Next.js 14",
      "App Router",
      "React Server Components",
      "Swift",
      "Kotlin",
      "REST APIs",
      "Cloud infrastructure",
      "Loyalty engine",
      "Campaign management",
      "Push notifications",
      "Deep links",
      "POS integration"
     ],
     "prods": [],
     "img": "assets/cases/a101-superapp.webp",
     "pdf": "1-5QLPHUxGbV5c0n_AwGflgNKYLbj3sHA"
    },
    {
     "key": "A101 Plus (Hadi)",
     "app": "Plus (Hadi)",
     "sub": "Loyalty programme",
     "d": "Punch cards, balance, personalised campaign mechanics and real-time earn-and-redeem at the till.",
     "metrics": [
      [
       "1M",
       "downloads in the first 2 months"
      ]
     ],
     "when": null,
     "ctx": "13,000+ stores and millions of daily customers, but without loyalty there is no digital relationship between visits. Hadi turns every checkout into a touchpoint and every purchase into a balance.",
     "need": "Over 13,000 POS systems had to communicate in real time, not in overnight batches, with punch cards, balance and campaign redemption at register speed. Adoption also had to be fast: low enrolment would make it a cost centre, not a growth driver.",
     "approach": "POS integration from day one, not as an afterthought. A native mobile app for enrolment, balance and campaigns, a campaign engine for personalised offers by shopping pattern, and a launch strategy that drove 1M downloads in 2 months.",
     "features": [
      [
       "Digital punch cards",
       "Digital punch cards replace physical stamps and earn automatically at checkout via POS, with no manual staff action."
      ],
      [
       "Balance accumulation",
       "Earn on every purchase, see the balance update in the app in real time and redeem it across all 13,000+ stores."
      ],
      [
       "Personalised campaigns",
       "Offers targeted by shopping pattern, such as category, frequency and basket value, rather than generic discounts."
      ],
      [
       "Real-time POS connectivity",
       "Scan, earn, watch the balance update and redeem at any store, closing the physical-digital loop in seconds."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "Punch card engine",
      "Balance management",
      "Campaign delivery",
      "POS connectivity",
      "Shopping pattern analysis",
      "Segment campaigns"
     ],
     "prods": [],
     "img": "assets/cases/a101-plus.webp",
     "pdf": "1RXQGGnur0CfWRbBfYobTdJ_y2MIRFzS-"
    }
   ]
  },
  {
   "id": "lc-waikiki",
   "name": "LC Waikiki",
   "sector": "ret",
   "logo": null,
   "projects": [
    {
     "key": "LC Waikiki KazanıYORUM",
     "app": "KazanıYORUM",
     "sub": "Fashion loyalty",
     "d": "A platform where shoppers earn points through segment-specific surveys and turn them into gift vouchers.",
     "metrics": [
      [
       "500K+",
       "downloads"
      ],
      [
       "99.6%",
       "crash-free"
      ]
     ],
     "when": null,
     "ctx": "Traditional loyalty rewards purchases and captures the customer only at the register. KazanıYORUM captures them between purchases: share opinions, earn points, redeem them as discounts. The brand gets behavioural data; the customer is rewarded for engagement.",
     "need": "Survey-based loyalty had to feel rewarding, not tedious: surveys that feel like homework get abandoned, and points that feel worthless don’t drive behaviour. It needed a personalised feed, instant point crediting and smooth in-store redemption.",
     "approach": "A complete native rebuild in Swift and Kotlin. Personalised content matching surveys to profiles, a secure points system integrated with the LCW backend, and an interface designed around the core loop: see, answer, earn, spend.",
     "features": [
      [
       "Personalised survey feed",
       "Short surveys matched to profile, interests and shopping history, maximising completion and data quality."
      ],
      [
       "Points and rewards engine",
       "Points earned from surveys and interactions are credited in real time on a secure ledger integrated with the LCW backend."
      ],
      [
       "Reward redemption",
       "Points turn into discounts in LCW stores and online, so Tuesday’s survey becomes Saturday’s discount."
      ],
      [
       "Modern interface",
       "Rebuilt from the previous version, with real-time tracking, progress and transaction history."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "Backend integration",
      "Secure points ledger",
      "Personalised survey management",
      "Profile targeting",
      "Firebase"
     ],
     "prods": [],
     "img": "assets/cases/lcw-kazaniyorum.webp",
     "pdf": "1zWnZJzreBOfzQyLjCs9Vs6I4QpXzvp6g"
    }
   ]
  },
  {
   "id": "b-m-stores",
   "name": "B&M Stores",
   "sector": "ret",
   "logo": null,
   "projects": [
    {
     "key": "B&M Stores",
     "app": "",
     "sub": "UK retail",
     "d": "Personal feed, shopping list, barcode price check, punch cards, raffles and POS integration, with its own back office.",
     "metrics": [
      [
       "764",
       "stores"
      ],
      [
       "1M+",
       "downloads"
      ]
     ],
     "when": "Live in 2026",
     "ctx": "764 stores in the UK, 129 in France and 3M+ weekly shoppers. The app carries “Big Brands, Big Savings” into the shopper’s pocket.",
     "need": "Value-conscious shoppers want deals fast: a personal feed across thousands of products, instant in-store barcode scanning and notifications that drive visits without being intrusive.",
     "approach": "Native Swift and Kotlin for the UK device landscape. Personalised recommendations by preference, a shopping list bridging app and store, an in-store barcode checker, a location-based store finder and content for between-visit engagement.",
     "features": [
      [
       "Personalised product discovery",
       "Just For You recommendations based on profile and preferences, covering new arrivals, offers, Manager’s Specials and seasonal ranges."
      ],
      [
       "Shopping list",
       "Built in the app and taken to the store, bridging digital browsing and the physical shopping trip."
      ],
      [
       "Barcode price check",
       "Scan in store for full product information, prices and promotions, right at the shelf."
      ],
      [
       "Store finder",
       "Find any of 764 locations by location or postcode, filter by product range and save favourites."
      ],
      [
       "Content and engagement",
       "Lifestyle blogs, guides, seasonal trends, competitions, social sharing and personalised push notifications."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "Barcode scanning",
      "Push notifications",
      "Location services",
      "Personalisation engine",
      "Product catalogue",
      "Firebase Crashlytics",
      "Google Analytics"
     ],
     "prods": [
      {
       "id": "linkify",
       "built": [
        "Campaign, email and social links open the right product or offer screen in the app.",
        "One panel shows which channel brought installs and visits."
       ],
       "mods": [
        "Deep linking",
        "Attribution"
       ]
      },
      {
       "id": "notifica",
       "built": [
        "Personalised push notifications: new arrivals, offers, Manager’s Specials and seasonal campaigns by preference.",
        "Announcements for competitions and raffles, and messages that keep shoppers engaged between visits."
       ],
       "mods": [
        "Push notifications",
        "Segmentation",
        "Campaign management"
       ]
      }
     ],
     "img": "assets/cases/bm-stores.webp",
     "pdf": "1yvbShzjI7ajfIquLwj8jrO9O9XjKZLmq"
    }
   ]
  },
  {
   "id": "alisgidis",
   "name": "AlışGidiş",
   "sector": "ret",
   "logo": null,
   "projects": [
    {
     "key": "AlışGidiş × Fibabanka",
     "app": "× Fibabanka",
     "sub": "Marketplace & embedded finance",
     "d": "A digital shopping mall backed by Fibabanka: wallet, gamification, loyalty and credit at checkout, on 30+ microservices.",
     "metrics": [
      [
       "2024",
       "live since July"
      ],
      [
       "3",
       "payment providers"
      ]
     ],
     "when": null,
     "ctx": "AlışGidiş is a digital shopping mall backed by Fibabanka: a multi-seller marketplace bringing commerce and finance together on one platform.",
     "need": "Handle marketplace complexity at launch speed, and build engagement mechanics that stand out in Turkey’s crowded e-commerce market.",
     "approach": "Native mobile apps in Swift and Kotlin, a Next.js backoffice and production-tested SDK modules to accelerate delivery. The platform went live in July 2024.",
     "features": [
      [
       "Digital shopping mall",
       "Floor-based navigation (“Hangi katı gezmek istersin?”) makes a large multi-seller catalogue explorable, with renewed devices offered in instalments."
      ],
      [
       "Gamification and loyalty",
       "Challenges, achievements, progress and point accumulation, each mechanic mapped to a measurable business outcome."
      ],
      [
       "Microservice backbone",
       "30+ ASP.NET Core microservices running on Kubernetes, with queue-based notifications."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "Next.js",
      "ASP.NET Core",
      "30+ microservices",
      "Kubernetes",
      "Huawei Cloud"
     ],
     "prods": [],
     "img": "assets/cases/alisgidis.webp",
     "pdf": "1ot5rklJO_T0J9-Phr006khyxqSDZJ1uS"
    }
   ]
  },
  {
   "id": "altinmarka",
   "name": "Altınmarka",
   "sector": "ret",
   "logo": null,
   "projects": [
    {
     "key": "Altınmarka",
     "app": "",
     "sub": "Manufacturer: B2C & B2B commerce",
     "d": "Mobile app, web and marketplaces run from one platform, with every integration in place.",
     "metrics": [
      [
       "3 months",
       "to go live with all integrations"
      ],
      [
       "50+",
       "countries"
      ]
     ],
     "when": "Live since August 2025",
     "ctx": "The world’s second-largest industrial chocolate producer: 270K tonnes of annual capacity across 50+ countries. Two audiences: professional buyers (B2B) and consumers (B2C).",
     "need": "Two buying journeys on one platform: bulk pricing and corporate accounts for B2B, consumer shopping and recipes for B2C. Plus marketplace connectors, on a three-month timeline.",
     "approach": "Loodos commerce infrastructure, with production-tested modules, served as the foundation. A native mobile app, responsive web for B2C and B2B, and marketplace connectors all went live by August 2025.",
     "features": [
      [
       "B2C consumer e-commerce",
       "A full catalogue of chocolates, cocoa, pastry ingredients, vegan and seasonal products, with category browsing, recipes, cart and checkout."
      ],
      [
       "B2B corporate commerce",
       "Corporate pricing, volume ordering and business accounts for professionals and food service at wholesale scale."
      ],
      [
       "Marketplace integration",
       "The direct platform and external marketplaces are managed from a single inventory and single order management."
      ],
      [
       "Mobile app",
       "Native mobile commerce with push notifications for campaigns and new products."
      ],
      [
       "Content and recipes",
       "Recipes connecting products to usage inspiration, and a blog driving organic traffic."
      ]
     ],
     "tech": [
      "Native mobile (iOS",
      "Android)",
      "Responsive web e-commerce",
      "Loodos commerce infra",
      "Catalogue",
      "Cart",
      "Checkout",
      "Payments",
      "Marketplace connectors",
      "Order management",
      "Inventory sync"
     ],
     "prods": [
      {
       "id": "vendica",
       "built": [
        "Vendica’s e-commerce module: catalogue, cart, payment and orders, proven at Kahve Dünyası, came ready; B2B and B2C run on the same platform.",
        "The marketplace integration module: the direct store and external marketplaces share one inventory and one order flow; the platform went live with every integration in three months."
       ],
       "mods": [
        "E-commerce",
        "Marketplace integration"
       ]
      }
     ],
     "img": "assets/cases/altinmarka.webp",
     "pdf": "12b4i7m7nrs9RrL9bBlQ_eL_li_SNKQuv"
    }
   ]
  },
  {
   "id": "vodafone",
   "name": "Vodafone",
   "sector": "tel",
   "logo": null,
   "projects": [
    {
     "key": "Vodafone Yanımda",
     "app": "Yanımda",
     "sub": "Operator super app",
     "d": "Self-service, contactless payment, a marketplace and 500+ personalised journeys, built and run by the same team.",
     "metrics": [
      [
       "18M",
       "monthly active users"
      ],
      [
       "99.92%",
       "crash-free; #1 across Vodafone markets"
      ]
     ],
     "when": null,
     "ctx": "Vodafone Yanımda is the operator’s main digital touchpoint for 18M subscribers, with 500+ personalised journeys.",
     "need": "Zero-downtime expectations and performance on every device from 5G to 3G, while leading Vodafone Group’s benchmark across all its markets.",
     "approach": "Native engineering on both platforms (Kotlin and Swift), real-time distributed tracing that catches degradation before subscribers feel it, and continuous code quality and container security in every pipeline. The same team builds and operates it.",
     "features": [
      [
       "Operator self-service",
       "Balance, packages, bill payment, account management and plan changes, all handled in the app."
      ],
      [
       "Contactless mobile payment",
       "Operator transactions, e-commerce and marketplace shopping turn a service channel into a commercial platform."
      ],
      [
       "Marketplace and offers",
       "Partner offers and campaigns are surfaced in the app to 18 million monthly active users."
      ],
      [
       "500+ personalised journeys",
       "Each subscriber sees a different experience based on plan, usage, loyalty status and preferences."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "Jetpack Compose",
      "LoopBack 4",
      "OAuth2",
      "OpenID Connect",
      "Kubernetes",
      "Docker",
      "Cloudflare",
      "RabbitMQ",
      "Azure Service Bus",
      "DataDog",
      "OpenTelemetry",
      "SonarQube",
      "Aqua Trivy"
     ],
     "prods": [
      {
       "id": "linkify",
       "built": [
        "Campaign and offer links in SMS, email and on the web open the matching screen on iOS, Android and Huawei devices.",
        "One panel shows what each channel brought in."
       ],
       "mods": [
        "Deep linking",
        "Attribution",
        "Huawei (HMS) support"
       ]
      }
     ],
     "img": "assets/cases/vodafone-yanimda.webp",
     "pdf": "1APDDFxpFfT0btLh8Hu8TpeVlWTXuGI93"
    },
    {
     "key": "Vodafone OneApp",
     "app": "OneApp",
     "sub": "Digital workplace",
     "d": "QR building access, meeting-room and gym booking, staff campaigns and Coffee Talks.",
     "metrics": [
      [
       "99.9%",
       "crash-free"
      ]
     ],
     "when": null,
     "ctx": "While Vodafone Yanımda serves external users, OneApp is the enterprise intranet for Vodafone Turkey’s own workforce: a mobile-first workplace hub employees open daily, not a slow portal nobody uses.",
     "need": "LDAP corporate authentication, QR physical access replacing cards, real-time parking connected to facility systems, and engagement modules that actually get used.",
     "approach": "Native Swift/Kotlin for consumer-grade quality, a .NET and MSSQL backend, LDAP single sign-on, physical access integration for QR entry, and a modular architecture where each function runs independently.",
     "features": [
      [
       "Contactless building access",
       "QR mobile entry replaces physical cards and works with the existing access infrastructure."
      ],
      [
       "Reservations",
       "Meeting rooms, gym and shared spaces are booked with calendar integration and conflict prevention."
      ],
      [
       "Stories",
       "Company news, projects and success stories are shared in an internal social feed with likes and comments."
      ],
      [
       "Campaigns Hub",
       "Employee discounts, partner offers and internal perks are managed in one place."
      ],
      [
       "Coffee Talks",
       "Registration, reminders and archives for tech and career events live in the app."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      ".NET",
      "MSSQL",
      "LDAP",
      "Firebase",
      "Netmera"
     ],
     "prods": [],
     "img": "assets/cases/vodafone-oneapp.webp",
     "pdf": "1D9kHPLfZCrodUEqF7SLQS821uwSCFveO"
    }
   ]
  },
  {
   "id": "sunexpress",
   "name": "SunExpress",
   "sector": "avi",
   "logo": null,
   "projects": [
    {
     "key": "SunExpress",
     "app": "",
     "sub": "Passenger app",
     "d": "Booking, seat selection, check-in, wallet boarding passes and flight alerts across several countries, shipped with AI-assisted CI/CD.",
     "metrics": [
      [
       "2025",
       "new app live since August"
      ]
     ],
     "when": null,
     "ctx": "SunExpress is a Lufthansa and Turkish Airlines joint venture with multi-country operations. It needed a mobile experience for passengers from a partner who understands aviation’s regulatory sensitivities.",
     "need": "Multi-country authentication, real-time flight data, booking changes mid-journey and passenger data security.",
     "approach": "Native Swift and Kotlin on both platforms, OAuth2, Kubernetes and distributed messaging, with CI/CD for seamless multi-country service. The team is embedded in SunExpress digital operations.",
     "features": [
      [
       "Booking and extras",
       "Booking, seat selection, baggage and meals, plus reservation management, in one app."
      ],
      [
       "Online check-in",
       "The mobile boarding pass can be added to Apple or Google Wallet."
      ],
      [
       "Real-time flight notifications",
       "Passengers receive real-time notifications about their flights."
      ],
      [
       "Offline and multilingual",
       "Trip details are available offline, the app is multilingual, and it launched in August 2025."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "OAuth2",
      "OpenID Connect",
      "Kubernetes",
      "Docker",
      "RabbitMQ",
      "DataDog",
      "CI/CD"
     ],
     "prods": [],
     "img": "assets/cases/sunexpress.webp",
     "pdf": "1a_Ld-dnimISp4h_nadeB-sajOlNZkk8B"
    },
    {
     "key": "SunExpress SunPass",
     "app": "SunPass",
     "sub": "Staff travel",
     "d": "Flight search and booking, announcements, surveys and check-in for staff in Germany and Türkiye.",
     "metrics": [
      [
       "4,000+",
       "employees"
      ]
     ],
     "when": null,
     "ctx": "SunExpress employees in Germany and Turkey needed staff flight search, booking and travel management, plus one channel for announcements, news, surveys and check-in support.",
     "need": "Aviation governance across two jurisdictions, staff travel rules (standby, availability) that differ from public booking, and MDM deployment on corporate devices with specific security settings.",
     "approach": "Native Swift/Kotlin for MDM reliability, flight search customised to staff travel rules, MDM distribution for corporate rollout, and an integrated comms hub for announcements, surveys and check-in.",
     "features": [
      [
       "Staff flight search and booking",
       "A booking flow tailored to employee rules, showing standby and availability."
      ],
      [
       "Corporate communications",
       "Announcements, news and updates reach every employee in both countries through one channel."
      ],
      [
       "Surveys and check-in support",
       "From search to booking to check-in, the whole journey happens in one app."
      ],
      [
       "MDM distribution",
       "The app is rolled out in a controlled way to more than 4,000 employees in two countries via corporate-managed devices."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "MDM",
      "Corporate Auth",
      "Push Notifications"
     ],
     "prods": [],
     "img": "assets/cases/sunpass.webp",
     "pdf": "1DVRbMIO78sIC4iq5CgYjNlOHj0mLfLhM"
    },
    {
     "key": "SunExpress Voice",
     "app": "Voice assistant",
     "sub": "AI passenger service",
     "d": "A voice assistant that handles rebooking, check-in, flight status and baggage questions on its own.",
     "metrics": [],
     "when": null,
     "ctx": "An AI voice pilot for passenger service at SunExpress.",
     "need": null,
     "approach": null,
     "features": [
      [
       "Autonomous passenger service",
       "The pilot covers rebooking, check-in, flight status and baggage."
      ],
      [
       "Voice and text",
       "Passenger service runs over voice and text, with multi-scenario calls."
      ]
     ],
     "tech": [],
     "prods": [],
     "img": null,
     "pdf": "1oSiSdASxuw3UNz3X5JCy3Jl1s9STHEFC"
    }
   ]
  },
  {
   "id": "fibabanka",
   "name": "Fibabanka",
   "sector": "fin",
   "logo": null,
   "projects": [
    {
     "key": "Fibabanka × AlışGidiş",
     "app": "× AlışGidiş",
     "sub": "Embedded finance",
     "d": "The bank’s credit and wallet in the middle of shopping: credit at checkout, loyalty and gamification in one flow.",
     "metrics": [
      [
       "30+",
       "microservices"
      ]
     ],
     "when": null,
     "ctx": "Banks want engagement beyond bill checks; retailers want financial services that increase basket value. Fibabanka brings both together in AlışGidiş, with wallet and credit inside the shopping experience.",
     "need": "Embed a banking-grade wallet and credit inside a retail experience, so the user doesn’t feel the transition from browsing to a credit application.",
     "approach": "A payment core with an adapter architecture integrates multiple payment providers. Identity management is built on OAuth2 and OpenID Connect, and the Fibabanka Credit API is wired into the checkout flow.",
     "features": [
      [
       "Digital wallet",
       "Fibabanka-backed top-up, balance and transaction history, the financial backbone connecting shopping to banking."
      ],
      [
       "Credit at checkout",
       "Eligibility, instalment plan selection and application happen during purchase, within the shopping experience."
      ],
      [
       "Adapter-based payment core",
       "iyzico, Masterpass and the Fibabanka Credit API plug into the same payment core through adapters."
      ],
      [
       "Identity and access",
       "Secure sign-in and access built on OAuth2, OpenID Connect, JWT and role-based access control."
      ]
     ],
     "tech": [
      "iyzico",
      "Masterpass",
      "Fibabanka Credit API",
      "OAuth2",
      "OpenID Connect",
      "JWT",
      "RBAC",
      "ASP.NET Core",
      "Kubernetes"
     ],
     "prods": [],
     "img": "assets/cases/alisgidis.webp",
     "pdf": "1jFtJAMLVHEsxw0NvZ7TcF12pvlKhSZvw"
    }
   ]
  },
  {
   "id": "ekuri",
   "name": "Eküri",
   "sector": "fin",
   "logo": null,
   "projects": [
    {
     "key": "Eküri",
     "app": "",
     "sub": "Licensed horse-racing platform",
     "d": "Live streaming, ready-made coupons and 24/7 multi-bank deposits and withdrawals, with TJK integration on a modular base.",
     "metrics": [
      [
       "2024",
       "live since April"
      ],
      [
       "24/7",
       "deposits and withdrawals"
      ]
     ],
     "when": null,
     "ctx": "Eküri is a TJK-licensed virtual dealer: a “new generation” platform replacing traditional ganyan with live streaming, real-time stats, expert analysis and instant financial transactions.",
     "need": "Live broadcast without latency, instant odds and results, 24/7 financial transactions, complex statistics made easy to read, TJK compliance and responsible gaming, and a structure open to global racing integration.",
     "approach": "Web and native mobile built in parallel, with the TJK API for real-time data, live streaming infrastructure, a multi-bank financial system, expert editorial content and a modular architecture for international expansion.",
     "features": [
      [
       "Live race broadcast",
       "All domestic and international races are streamed live, so users can watch and bet at the same time."
      ],
      [
       "Betting and coupon builder",
       "All TJK bet types, including Altılı, 7’li Plase, Ganyan, Plase, İkili and Tabela, with fast coupons and expert ready-mades."
      ],
      [
       "Statistics and analysis",
       "Horse performance, jockey records, track history, expert commentary and AGF lists."
      ],
      [
       "Financial infrastructure",
       "Multi-bank 24/7 deposits and withdrawals, instant winnings transfer, and campaign and bonus management."
      ],
      [
       "Modular global architecture",
       "The infrastructure is designed beyond TJK to support international racing organisations."
      ]
     ],
     "tech": [
      "Native iOS",
      "Android",
      "Responsive Web",
      "Live Streaming",
      "TJK API",
      "Multi-bank Payments"
     ],
     "prods": [],
     "img": "assets/cases/ekuri.webp",
     "pdf": "1y_lMPHFcdeIh3GRy-04n0iIqHVWIRD-R"
    }
   ]
  },
  {
   "id": "kahve-dunyasi",
   "name": "Kahve Dünyası",
   "sector": "fnb",
   "logo": null,
   "projects": [
    {
     "key": "Kahve Dünyası",
     "app": "",
     "sub": "Coffee-chain super app",
     "d": "Order-ahead with Hazır Al, QR payment, e-commerce, workshop tickets and the Çekirdek loyalty programme.",
     "metrics": [
      [
       "500+",
       "locations with QR payment"
      ]
     ],
     "when": null,
     "ctx": "Coffee, chocolate, gifts and workshops: a super app joining four business models across 500+ locations.",
     "need": "Order-ahead in sync with preparation, QR payment that works across 500+ locations, and four business models presented as one experience.",
     "approach": "Purpose-built order-ahead for café operations, queue management balancing mobile and walk-in orders, and QR payment with an offline fallback. A modular architecture means a new business model is a new module, not a rebuild.",
     "features": [
      [
       "Hazır Al",
       "Described as Turkey’s first remote coffee ordering: order from your phone and arrive to a ready drink, with the preparation queue coordinated with in-store operations."
      ],
      [
       "QR contactless payment",
       "Scan, confirm, done at 500+ locations, integrated with loyalty, e-commerce and ordering, and reliable across varied network conditions."
      ],
      [
       "E-commerce and gifting",
       "Packaged coffee, chocolate and gift boxes with nationwide delivery and corporate gifting, turning café customers into online shoppers."
      ],
      [
       "Workshop ticketing",
       "Barista workshops and chocolate tastings are bookable and payable in the app, integrated with Çekirdek loyalty."
      ],
      [
       "Çekirdek loyalty",
       "Earn points in store and online and redeem them everywhere, with personalised campaigns connecting every touchpoint."
      ]
     ],
     "tech": [
      "Swift (iOS)",
      "Kotlin (Android)",
      "E-commerce platform (kahvedunyasi.com)",
      "QR contactless payment",
      "POS integration",
      "Product catalogue",
      "Cart",
      "Delivery",
      "Modular architecture"
     ],
     "prods": [
      {
       "id": "vendica",
       "built": [
        "The Hazır Al (order-ahead) module: customers pick a store, order and pay in the app, and their drink is ready when they arrive; each preparation step is sent by push or SMS.",
        "The same module’s loyalty, wallet and QR flow: Çekirdek loyalty points, a top-up wallet, and one QR scan at the till for recognition, rewards and payment.",
        "The e-commerce module: packaged coffee, chocolate and gift boxes on kahvedunyasi.com and in the app, with nationwide delivery and corporate gifting.",
        "Kahve Dünyası uses both Vendica modules together; the e-commerce module was later reused at Altınmarka and the Hazır Al module at Goa Café."
       ],
       "mods": [
        "Hazır Al (order-ahead)",
        "Loyalty & wallet",
        "QR recognition & payment at the till",
        "E-commerce"
       ]
      },
      {
       "id": "linkify",
       "built": [
        "Campaign and Çekirdek loyalty links open the matching module: Hazır Al ordering, e-commerce, workshop tickets or loyalty.",
        "One panel shows what each channel brought in."
       ],
       "mods": [
        "Deep linking",
        "Attribution"
       ]
      }
     ],
     "img": "assets/cases/kahve-dunyasi.webp",
     "pdf": "1HeFgfONiiN09n9fgCy63UY-rpiadhiQE"
    }
   ]
  },
  {
   "id": "frink",
   "name": "Frink",
   "sector": "fnb",
   "logo": null,
   "projects": [
    {
     "key": "Frink",
     "app": "",
     "sub": "Coffee subscription",
     "d": "Subscription tiers, QR redemption and remote ordering across several café chains. Transactions are screened by NormX.",
     "metrics": [
      [
       "482K+",
       "app users"
      ]
     ],
     "when": null,
     "ctx": "Türkiye’s first coffee membership: one subscription, unlimited coffee from partner cafés. 482K+ app users across several café chains.",
     "need": "An “unlimited coffee” model invites abuse that pay-per-cup never sees: shared accounts, redemption velocity, location abuse. And at the counter, checks must finish in seconds.",
     "approach": "A native app built around QR redemption as the core interaction, flexible subscription tiers, remote ordering with preparation sync, ML anomaly detection for subscription-specific abuse, and simple onboarding for independent café operators.",
     "features": [
      [
       "Subscription management",
       "Frink (filtered) and Frink+ (specialty) tiers with plan selection, recurring payment, upgrade or downgrade and usage tracking."
      ],
      [
       "QR code redemption",
       "Show the QR, get your coffee: seconds at the counter, a short-code fallback, one-per-hour enforcement and remote-order QR codes valid for 15 minutes."
      ],
      [
       "Remote ordering",
       "Order ahead from any Frink Point and find your coffee ready on arrival, synced across independent cafés."
      ],
      [
       "Café network and map",
       "An interactive map of Frink Points, a multi-chain partner network and an onboarding flow for new cafés."
      ],
      [
       "Fraud and anomaly detection",
       "ML patterns on subscription transactions catch shared accounts, redemption velocity and location abuse, problems unique to unlimited models."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "Subscription management",
      "Recurring billing",
      "QR redemption",
      "Remote ordering with multi-chain preparation sync",
      "ML anomaly detection",
      "Transaction pattern analysis"
     ],
     "prods": [
      {
       "id": "normx",
       "built": [
        "Machine-learning anomaly detection on subscription transactions: every redemption is screened.",
        "Patterns specific to subscriptions: shared accounts, many redemptions in a short time and location mismatches.",
        "Works alongside in-app rules: one redemption per hour and a 15-minute window for remote-order QR codes.",
        "This work became the starting point for fraud detection in NormX and the Ops Agent."
       ],
       "mods": [
        "Anomaly detection",
        "Transaction pattern analysis"
       ]
      }
     ],
     "img": "assets/cases/frink.webp",
     "pdf": "1QylClHGJoVopUu5J9J6WzgKu7C4X6jkt"
    }
   ]
  },
  {
   "id": "goa-cafe",
   "name": "Goa Café",
   "sector": "fnb",
   "logo": null,
   "projects": [
    {
     "key": "Goa Café",
     "app": "",
     "sub": "Coffee chain: order-ahead",
     "d": "Order-ahead in the app for a coffee chain of around 140 stores, built on the Vendica Hazır Al module already running at Kahve Dünyası.",
     "metrics": [
      [
       "~2 months",
       "to set up (8–10 months on earlier projects)"
      ],
      [
       "~140",
       "stores"
      ]
     ],
     "when": "In progress (October 2026)",
     "ctx": "A coffee chain with around 140 stores is letting customers order ahead in the app and pick up in store.",
     "need": "Launching order-ahead fast: finishing in far less time a setup that took 8–10 months on earlier projects.",
     "approach": null,
     "features": [],
     "tech": [],
     "prods": [
      {
       "id": "vendica",
       "built": [
        "Only the Hazır Al (order-ahead) module is used: customers pick a store, customise their order from the menu, pay in the app and collect in store. Each step, from received to preparing, ready and collected, is sent by push or SMS.",
        "The module comes with loyalty and a wallet: stamps (“buy X, get one free”), points and membership tiers, a top-up digital wallet and saved-card payment.",
        "One QR scan at the till recognises the customer, records rewards and, if they want, takes payment; customers paying in cash or by card still earn points and stamps.",
        "The module is proven at Kahve Dünyası; because it comes ready, setup drops from 8–10 months to about two. POS, loyalty, payment and notification links use defined integration points."
       ],
       "mods": [
        "Order-ahead to a store",
        "Loyalty & points",
        "Digital wallet",
        "QR recognition & payment at the till",
        "Stores & location",
        "Notifications",
        "Back office"
       ]
      }
     ],
     "img": null,
     "pdf": "1Du3yo1plXe0MFriOfd0og_37MWLEdI1n"
    }
   ]
  },
  {
   "id": "oyak-renault",
   "name": "Oyak Renault",
   "sector": "ind",
   "logo": null,
   "projects": [
    {
     "key": "Oyak Renault FabrikaMobil",
     "app": "FabrikaMobil",
     "sub": "Factory workforce app",
     "d": "One app for every white- and blue-collar factory employee, set to roll out to every country with a Renault plant.",
     "metrics": [
      [
       "7,000",
       "monthly internal users"
      ],
      [
       "88%",
       "of staff use it"
      ]
     ],
     "when": null,
     "ctx": "FabrikaMobil is Oyak Renault’s internal mobile app for white-collar and blue-collar staff. It reaches an average of 7,000 internal users a month and is used by 88% of in-house staff.",
     "need": null,
     "approach": null,
     "features": [
      [
       "Broad internal adoption",
       "Used by 88% of in-house staff, across white-collar and blue-collar roles."
      ],
      [
       "Daily use",
       "Used by at least 300 employees every day."
      ],
      [
       "Error-free app",
       "Described in the corporate deck as a 100% error-free application."
      ]
     ],
     "tech": [],
     "prods": [],
     "img": "assets/cases/fabrikamobil.webp",
     "pdf": "1OCY9THW6LgztPMxz-6E3xtYHCw3IXCuk"
    }
   ]
  },
  {
   "id": "bosch",
   "name": "Bosch",
   "sector": "ind",
   "logo": null,
   "projects": [
    {
     "key": "Bosch",
     "app": "",
     "sub": "Factory digital transformation",
     "d": "Shuttles, canteen menus, shifts, surveys and announcements, available in every country in the Bosch global catalogue.",
     "metrics": [],
     "when": null,
     "ctx": "Bosch operates factories across dozens of countries. Workers needed shuttle times, lunch menus, shift info and announcements on their phones, on a platform that is globally standardised yet locally configurable.",
     "need": "Consistent enough for the Bosch Global catalogue, yet configurable for each facility’s routes, menus, shifts and HR. Factory workers check in during breaks and need information in seconds.",
     "approach": "Native Swift/Kotlin with a modular architecture where each module is configured independently: shift-aware routing, a cafeteria with nutrition data, a survey engine, and design built on daily utility rather than gamification.",
     "features": [
      [
       "Shuttle and service routes",
       "Shift-based shuttle times and route selection, configurable per facility."
      ],
      [
       "Cafeteria menu",
       "A daily menu updated by catering, with calorie counts for each item."
      ],
      [
       "Employee surveys",
       "Structured feedback from the factory floor, collected inside an app workers already use."
      ],
      [
       "Announcements",
       "Company updates, safety information and corporate comms reach every employee on every shift."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "Shift Routing",
      "Cafeteria Integration",
      "Survey Engine",
      "Push Notifications"
     ],
     "prods": [],
     "img": "assets/cases/bosch.webp",
     "pdf": "1yIvPkhMRdUpxICzoNiB3VEtYp1nOXa6x"
    }
   ]
  },
  {
   "id": "yildiz-holding",
   "name": "Yıldız Holding",
   "sector": "ind",
   "logo": null,
   "projects": [
    {
     "key": "Yıldız Holding iGoya",
     "app": "iGoya",
     "sub": "Field operations & computer vision",
     "d": "Shelf checks, alerts and action tracking, with computer-vision planogram checks and machine-learning process management.",
     "metrics": [
      [
       "20%",
       "field-efficiency gain (Yıldız Holding data)"
      ],
      [
       "2",
       "cities: London and Dubai"
      ]
     ],
     "when": null,
     "ctx": "Yıldız Holding’s field teams visit stores daily for shelf checks and issue handling. Before iGoya, this ran on paper forms, phone calls and spreadsheets.",
     "need": "Hundreds of store visits a week across countries and languages. Slow out-of-stock response means lost sales, and manual alarms and reporting cause delays. The platform had to work in Turkish, English and Arabic.",
     "approach": "Native mobile plus a web platform with multi-layered roles (superadmin and field), flexible alarm rules triggered automatically on shelf violations, structured response workflows and Excel reporting that feeds HQ analytics.",
     "features": [
      [
       "Alarm management",
       "Real-time alerts triggered automatically when products are out of stock, configurable by product, category and location."
      ],
      [
       "Response mechanism",
       "Pre-defined or custom responses separate items needing action from those acknowledged, with full traceability."
      ],
      [
       "Action tracking",
       "Open items, pending actions and resolution status give field managers the complete picture."
      ],
      [
       "Reporting infrastructure",
       "Stock, alarm and response reports are generated on demand, with Excel output for BI integration."
      ],
      [
       "Multilingual",
       "In Turkish, English and Arabic, the same platform serves Turkey and international markets."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "C# (.NET)",
      "Web",
      "Excel Reporting",
      "TR/EN/AR Localisation"
     ],
     "prods": [],
     "img": "assets/cases/igoya.webp",
     "pdf": "108cT-BhE804SzLsfbhGXoCNWwjNUHsSL"
    }
   ]
  },
  {
   "id": "zorlu-enerji",
   "name": "Zorlu Enerji",
   "sector": "ind",
   "logo": null,
   "projects": [
    {
     "key": "Zorlu Enerji",
     "app": "",
     "sub": "Energy subscription",
     "d": "Subscriptions, cancellations, consumption analysis, bill payment and service requests in the app, no agent needed. A TÜBİTAK-backed ESG reporting platform is also being built together.",
     "metrics": [],
     "when": null,
     "ctx": "Zorlu Enerji, part of Zorlu Holding, is an electricity provider. The mobile channel turns every call centre contact or office visit into self-service on the phone.",
     "need": "Multi-layer authentication for sensitive operations like billing, payments and cancellations, real-time CRM sync across channels, and an interface simple enough for everyone from tech-savvy users to elderly customers.",
     "approach": "Native Swift/Kotlin for security and performance, a .NET 8 backend with CDN, multi-layer authentication, direct CRM and payment integration, and user-friendly design that makes complex utility tasks feel simple.",
     "features": [
      [
       "Subscription management",
       "New electricity subscriptions are set up in the app, with no office visit or paperwork."
      ],
      [
       "Consumption tracking",
       "Visual charts, comparison with past usage or area averages, and personalised saving suggestions."
      ],
      [
       "Bill viewing and payment",
       "Current and past bills can be viewed and paid in-app, with no redirect."
      ],
      [
       "Service requests",
       "Evacuation requests and bill objections are submitted and tracked in the app."
      ],
      [
       "Payment centre map",
       "An interactive map of payment centres and partner banks, with directions to the nearest one."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      ".NET 8",
      "CDN",
      "CRM",
      "Payment",
      "Firebase",
      "Jenkins"
     ],
     "prods": [],
     "img": "assets/cases/zorlu-enerji.webp",
     "pdf": "1z-vno-KGZRqL_eQ03peGYre7bWwVySFz"
    }
   ]
  },
  {
   "id": "mess",
   "name": "MESS",
   "sector": "ind",
   "logo": null,
   "projects": [
    {
     "key": "MESS MEXT",
     "app": "MEXT",
     "sub": "Technology-centre operations",
     "d": "Digital identity with QR access, training and events at Türkiye’s largest technology centre.",
     "metrics": [
      [
       "650+",
       "companies served (MESS data)"
      ]
     ],
     "when": null,
     "ctx": "According to MESS, it has 250+ members and 210K employees; the MEXT Technology Center has served 650+ companies and trained 31K+ professionals. The center needed digital operations to match that positioning.",
     "need": "A center advocating digital transformation must practise it: visitor identity, training enrolment, event registration and center processes all managed digitally, for users ranging from C-level executives to factory engineers and international delegations.",
     "approach": "Native Swift/Kotlin for the MESS and MEXT apps, with digital identity as the central access layer, QR verification for physical access and attendance, training management from catalogue to completion, and event registration tied to the operations schedule.",
     "features": [
      [
       "Digital identity and access",
       "One identity for every interaction and QR building access, with no paper badges or manual registration."
      ],
      [
       "Training management",
       "Browse programmes, enrol and track completion, from enrolment to certification."
      ],
      [
       "Event registration",
       "Registration for events, workshops and corporate visits, with attendance tracking and calendar integration."
      ],
      [
       "MESS communications",
       "Announcements, news and online training flow from MESS to its member ecosystem."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "Digital Identity",
      "QR Verification",
      "Access Control",
      "Training Management",
      "Calendar Integration"
     ],
     "prods": [],
     "img": "assets/cases/mess-mext.webp",
     "pdf": "1BUScCJj5bM4ip3cuzL8Zxpn9ksBGdLUi"
    }
   ]
  },
  {
   "id": "petrol-ofisi",
   "name": "Petrol Ofisi",
   "sector": "life",
   "logo": null,
   "projects": [
    {
     "key": "Petrol Ofisi PO Sosyal Lig",
     "app": "PO Sosyal Lig",
     "sub": "Fantasy football & loyalty",
     "d": "A fantasy football game with live match scoring that turns fuel purchases into in-game budget.",
     "metrics": [
      [
       "3.3M+",
       "players"
      ],
      [
       "100K",
       "weekly active players"
      ]
     ],
     "when": null,
     "ctx": "Petrol Ofisi wanted to reach younger drivers. A fantasy football game tied to real Süper Lig matches turns engagement with the game into engagement with the brand, and every fuel purchase earns in-game budget.",
     "need": "Fantasy football on the Süper Lig did not exist. Live match data, scoring, squad management for millions, tournament and prize infrastructure and a fuel-to-game loyalty loop all had to be built from scratch.",
     "approach": "Native Swift/Kotlin apps, a real-time data pipeline processing every match event and a squad engine for millions of teams. Tournaments, leaderboards, advertising and loyalty integration, plus predictions and trivia for engagement between matchdays.",
     "features": [
      [
       "Squad management",
       "Build an eleven from Süper Lig players within budget, with weekly transfers and player suggestions."
      ],
      [
       "Live scoring",
       "Every match event, from goals and assists to cards and saves, is processed live and scores update during matches."
      ],
      [
       "Tournaments and leaderboards",
       "Weekly, four-week and seasonal tournaments with prizes ranging from cars to fuel vouchers."
      ],
      [
       "Petrol Ofisi loyalty",
       "Physical fuel purchases turn into digital in-game currency."
      ],
      [
       "Mini-games and content",
       "Prediction games, one-on-one duels and trivia, alongside news, videos and podcasts."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "Live match pipeline",
      "Event-to-score",
      "Squad engine",
      "Tournaments",
      "Leaderboards",
      "Loyalty integration"
     ],
     "prods": [],
     "img": "assets/cases/po-sosyal-lig.webp",
     "pdf": "1--rNqiEJWDpsiB4fUdThzfeUvzVg9Z7i"
    }
   ]
  },
  {
   "id": "iyi-yasa",
   "name": "İyi Yaşa",
   "sector": "life",
   "logo": null,
   "projects": [
    {
     "key": "İyi Yaşa",
     "app": "",
     "sub": "Wellness subscription",
     "d": "Yoga, fitness, meditation and more: subscription video series by category, with points and in-app purchases.",
     "metrics": [
      [
       "500+",
       "classes"
      ]
     ],
     "when": null,
     "ctx": "İyi Yaşa is designed as a long-term wellbeing companion rather than a 30-day challenge. It understands the user’s level, interests and schedule, and curates content that builds sustainable habits.",
     "need": "It had to compete with free YouTube content and global platforms. The differentiator was Turkish-language content from trusted local trainers, backed by HD video at scale, flexible subscriptions, in-app purchase and personalisation.",
     "approach": "Native Swift/Kotlin for smooth video playback, subscriptions via in-app purchase and credit card, a points system, advanced filtering and a personalised feed that learns preferences.",
     "features": [
      [
       "Video content platform",
       "HD streaming across 500+ classes, weekly new content and favourites for quick re-access."
      ],
      [
       "7-category library",
       "Yoga, fitness, meditation, face yoga, kitchen, workshops and sustainability, from beginner to advanced."
      ],
      [
       "Personalisation and filtering",
       "Filter by category, body area, difficulty, duration and trainer, while “Tercihlerim” learns usage patterns."
      ],
      [
       "Subscription and payments",
       "Flexible plans, in-app purchase on iOS and Android, credit card payments and points that reward consistency."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "HD streaming",
      "Offline capability",
      "In-app purchase",
      "Subscription management",
      "Preference engine"
     ],
     "prods": [],
     "img": "assets/cases/iyi-yasa.webp",
     "pdf": "1yCD-AIJAVd0qtRNgG2_D0kuipNxklMFz"
    }
   ]
  },
  {
   "id": "iksv",
   "name": "İKSV",
   "sector": "life",
   "logo": null,
   "projects": [
    {
     "key": "İKSV Mobile",
     "app": "Mobile",
     "sub": "Culture & arts",
     "d": "A content-led app with dynamic modules for the festivals, the Biennial, Salon and Lale Kart.",
     "metrics": [
      [
       "99.9%",
       "crash-free"
      ]
     ],
     "when": null,
     "ctx": "Since 1973 İKSV has run the Film, Music, Jazz and Theatre festivals, the Istanbul Biennial, the Design Biennial, Filmekimi and Salon. Loodos built the app as a sponsor, not as a vendor.",
     "need": "A cultural audience expects design that matches the art it follows. Content changes constantly, so festivals with distinct identities had to share one experience, update without app releases and stay stable at peak times.",
     "approach": "Flutter for cross-platform delivery with cultural-grade visual quality. Content-driven dynamic modules that adapt to each festival without code changes, and push notifications for schedule updates.",
     "features": [
      [
       "Festival programmes",
       "Film, Music, Jazz, Theatre, the Design Biennial and Filmekimi, each with its own programme, schedule and visual identity."
      ],
      [
       "Istanbul Biennial",
       "Exhibitions, artist profiles, venue maps and schedules form a digital layer across the city’s exhibition spaces."
      ],
      [
       "Salon events",
       "Year-round concerts, talks and screenings beyond the festival seasons."
      ],
      [
       "Lale Kart membership",
       "Membership details for discounts, priority access and exclusive benefits, in the app."
      ],
      [
       "Dynamic content architecture",
       "New programmes and changes go live through content configuration, with no app updates."
      ]
     ],
     "tech": [
      "Flutter (iOS",
      "Android)",
      "Content-driven dynamic modules",
      "Push notifications",
      "Lale Kart integration"
     ],
     "prods": [],
     "img": "assets/cases/iksv.webp",
     "pdf": "13ynBPLMP7-im65MlZEGA22Bg8BMMvACr"
    }
   ]
  },
  {
   "id": "sweaters",
   "name": "Sweaters",
   "sector": "life",
   "logo": null,
   "projects": [
    {
     "key": "Sweaters",
     "app": "",
     "sub": "Sports tracking",
     "d": "Individual, corporate and group sport, with group messaging, performance tracking and inter-company competitions.",
     "metrics": [],
     "when": null,
     "ctx": "Sweaters is a tracking and activity platform that brings together individual, corporate and group sports activities.",
     "need": null,
     "approach": null,
     "features": [
      [
       "Sports activities",
       "Individual, corporate and group sports activities on one platform."
      ],
      [
       "In-group messaging",
       "Participants can message each other within their groups."
      ],
      [
       "Performance tracking",
       "Performance tracking and tracing operations run within the app."
      ],
      [
       "Corporate competitions",
       "Competitions can be organised for companies."
      ]
     ],
     "tech": [],
     "prods": [],
     "img": "assets/cases/sweaters.webp",
     "pdf": "1LEOP6y3I9kioKGabfjDcQ386oufjfpTJ"
    }
   ]
  },
  {
   "id": "brific",
   "name": "Brific",
   "sector": "mob",
   "logo": null,
   "projects": [
    {
     "key": "Brific",
     "app": "",
     "sub": "E-scooter",
     "d": "E-commerce, a ride app and Bluetooth hardware control: speed limit, ride modes, battery and range.",
     "metrics": [
      [
       "2",
       "design awards: iF and German Design"
      ]
     ],
     "when": null,
     "ctx": "Brific is an ownership-model e-scooter platform: users buy online and manage their scooter through a connected app. The digital experience covers the full lifecycle, from discovery and purchase to riding, monitoring and maintenance.",
     "need": "Three platforms had to work as one: a conversion-focused e-commerce site, a native mobile app with reliable BLE, and IoT firmware in sync with the hardware, all to a design standard on a par with premium mobility brands.",
     "approach": "Next.js web for showcasing and purchase, native Swift/Kotlin apps with direct Bluetooth Low Energy scooter connectivity, and .NET microservices on Kubernetes. The design-first approach resulted in iF Design and German Design Awards.",
     "features": [
      [
       "E-commerce web platform",
       "Product discovery, specifications and guides with a clean purchase flow."
      ],
      [
       "Mobile ride management",
       "Ride tracking, battery monitoring, riding modes and real-time scooter control over BLE."
      ],
      [
       "IoT hardware integration",
       "Custom SDKs for direct scooter connectivity, covering BLE pairing, firmware communication and real-time telemetry."
      ],
      [
       "Backend infrastructure",
       ".NET microservices on Kubernetes with PostgreSQL, RabbitMQ, Craftgate and iyzico payments, and JWT authentication."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "Bluetooth Low Energy",
      "Next.js",
      "Tailwind CSS",
      ".NET",
      "PostgreSQL",
      "Kubernetes",
      "RabbitMQ",
      "Craftgate",
      "iyzico"
     ],
     "prods": [],
     "img": "assets/cases/brific.webp",
     "pdf": "1Vmh-_hu6xuV9WPuM_IaAlBTYTUP4QDC1"
    }
   ]
  },
  {
   "id": "wewalk",
   "name": "WeWALK",
   "sector": "mob",
   "logo": null,
   "projects": [
    {
     "key": "WeWALK",
     "app": "",
     "sub": "Smart cane for blind and low-vision people",
     "d": "Navigation, public transit and live video support through the DANIŞ module: the smart cane’s companion app.",
     "metrics": [
      [
       "59",
       "countries"
      ]
     ],
     "when": null,
     "ctx": "WeWALK pairs a smart cane with ultrasonic sensors and a Bluetooth companion app, giving visually impaired users navigation, transit information, voice interaction and live human support. The app is the brain; the cane is the sensor.",
     "need": "This was not about bigger fonts: every interaction had to work through voice and haptics, controlled from the cane’s touchpad with the phone in a pocket. Where technology was not enough, live video support was needed.",
     "approach": "Native Swift/Kotlin built on accessibility as a foundation, BLE integration with the cane hardware and voice-first UX, with clock-direction navigation, transit information and Consult (DANIŞ) video calls with trained agents.",
     "features": [
      [
       "Accessible navigation",
       "Clock-direction turn-by-turn guidance, destination tracking and a low-vision map."
      ],
      [
       "Transit integration",
       "Nearby stops, incoming buses and timetables in 1,500+ cities, read aloud."
      ],
      [
       "Smart cane integration",
       "Bluetooth LE brings in obstacle data from the sensors and sends navigation commands back, so the phone stays in the pocket."
      ],
      [
       "Consult (DANIŞ) live video",
       "A trained agent sees through the user’s camera and gives real-time guidance for reading signs, identifying objects and indoor navigation."
      ],
      [
       "Exploration and discovery",
       "“What’s around me?” reveals nearby places by voice."
      ]
     ],
     "tech": [
      "Swift",
      "Kotlin",
      "Bluetooth LE",
      "Haptic",
      "Accessible turn-by-turn",
      "Video call (DANIŞ)",
      "Voice-first UX",
      "Screen reader optimized"
     ],
     "prods": [],
     "img": "assets/cases/wewalk.webp",
     "pdf": "1I9VHSHM0LKOlQgZ3a3YzRiQp9jkucKQV"
    }
   ]
  }
 ],
 "products": [
  {
   "id": "goventis",
   "name": "Goventis",
   "stage": 0,
   "mono": "Gv",
   "cat": "SDLC governance and code quality",
   "promise": "Uses AI to govern software delivery from requirement to design, plan and code, and keeps a trace of every decision.",
   "slogan": "Govern every decision before a line of code ships."
  },
  {
   "id": "linkify",
   "name": "Linkify",
   "stage": 1,
   "mono": "Lk",
   "cat": "Deep linking and attribution",
   "promise": "Sends every link to the right screen on iOS, Android and Huawei, and shows in one panel what each campaign brought in.",
   "slogan": "Link Smarter, Attribute Deeper."
  },
  {
   "id": "notifica",
   "name": "Notifica",
   "stage": 2,
   "mono": "Nt",
   "cat": "Push notifications and engagement",
   "promise": "Sends push, SMS, email and in-app messages from one place, at the best hour for each user, and shows the revenue they bring.",
   "slogan": "Push Smarter, Engage Everywhere."
  },
  {
   "id": "loopi",
   "name": "Loopi",
   "stage": 2,
   "mono": "Lp",
   "cat": "Stories and in-app engagement",
   "promise": "Brings Instagram-style stories into your app; content, targeting and data can stay on your own servers.",
   "slogan": "Stories Inside Your App, Data Inside Your Walls."
  },
  {
   "id": "lcap",
   "name": "Customer Activation",
   "stage": 3,
   "mono": "CA",
   "cat": "Customer activation and hyper-personalization",
   "promise": "Turns each customer’s behaviour into a personal offer, puts it in their hands in the app, at the till and on the web, and measures whether it worked.",
   "slogan": ""
  },
  {
   "id": "vendica",
   "name": "Vendica",
   "stage": 4,
   "mono": "Vd",
   "cat": "Commerce",
   "promise": "Runs a retailer’s web, mobile and marketplace channels with one catalog, one order flow and one stock.",
   "slogan": ""
  },
  {
   "id": "storefront",
   "name": "Vendica Storefront",
   "stage": 4,
   "mono": "Vs",
   "cat": "Storefront without a backend",
   "promise": "Gives a brand that already runs its own order, stock and ERP systems just the web and mobile shop front, connected to its backend through APIs.",
   "slogan": ""
  },
  {
   "id": "luminera",
   "name": "Luminera",
   "stage": 5,
   "mono": "Lm",
   "cat": "Survey and user insight",
   "promise": "Collects feedback at the moment of experience through the right channel, and automates sentiment analysis and NPS follow-up.",
   "slogan": "Ask Smarter, Understand Deeper."
  },
  {
   "id": "normx",
   "name": "NormX",
   "stage": 6,
   "mono": "Nx",
   "cat": "Data inconsistency and fraud detection",
   "promise": "Learns your data and business rules and regularly reports the records that break them. When your data deviates from the norm, you know first.",
   "slogan": "Every Transaction Scanned, Every Anomaly Caught."
  },
  {
   "id": "enterdec",
   "name": "Enterdec",
   "stage": 7,
   "mono": "Ed",
   "cat": "Enterprise decision intelligence",
   "promise": "Unifies digital, operational and infrastructure signals in one decision layer; it alerts on anomalies and triggers the action.",
   "slogan": "Decision-ready intelligence, the moment a signal fires."
  }
 ],
 "kpis": [
  [
   "28.7M",
   "monthly active users"
  ],
  [
   "120+",
   "enterprise projects"
  ],
  [
   "90+",
   "native mobile projects"
  ],
  [
   "100+",
   "team members"
  ],
  [
   "32",
   "R&D projects"
  ],
  [
   "99.92%",
   "crash-free rate (Vodafone Yanımda)"
  ]
 ],
 "timeline": [
  [
   "2004",
   "Founded in Istanbul"
  ],
  [
   "2014",
   "Mobile transformation: first apps with millions of monthly active users"
  ],
  [
   "2019",
   "Government-certified R&D centre"
  ],
  [
   "2025",
   "Our own language model goes live; our AI products run on it"
  ]
 ]
};

export interface TopArtist {
  name: string;
  image: string;
  spotifyId?: string;
}

export const TOP_ARTISTS_BY_LANG: Record<string, TopArtist[]> = {
  "Hindi": [
    {
      "name": "Arijit Singh",
      "image": "https://i.scdn.co/image/ab6761610000e5ebadfb0b2df04b77e43b5f7375",
      "spotifyId": "4YRxDV8wJFPHPTeXepOstw"
    },
    {
      "name": "Shreya Ghoshal",
      "image": "https://i.scdn.co/image/ab6761610000e5ebe7ce89a9f5d11e0ba26677eb",
      "spotifyId": "0oOet2f43PA68X5RxKobEy"
    },
    {
      "name": "A.R. Rahman",
      "image": "https://i.scdn.co/image/ab6761610000e5ebb19af0ea736c6228d6eb539c",
      "spotifyId": "1mYsTxnqsietFxj1OgoGbG"
    },
    {
      "name": "Neha Kakkar",
      "image": "https://i.scdn.co/image/ab6761610000e5eb2c3c6dc56635014fa90b32a6",
      "spotifyId": "5f4QpKfy7ptCHwTqspnSJI"
    },
    {
      "name": "Atif Aslam",
      "image": "https://i.scdn.co/image/ab6761610000e5ebc40600e02356cc86f0debe84",
      "spotifyId": "2oSONSC9zQ4UonDKnLqksx"
    },
    {
      "name": "Sunidhi Chauhan",
      "image": "https://i.scdn.co/image/ab6761610000e5eba45f7ef3e1c982461f2dad6b",
      "spotifyId": "3eDT9fwXKuHWFvgZaaYC5v"
    },
    {
      "name": "Jubin Nautiyal",
      "image": "https://i.scdn.co/image/ab6761610000e5eb2fe0fcf305ae8523cafc39a8",
      "spotifyId": "1tqysapcCh1lWEAc9dIFpa"
    },
    {
      "name": "Darshan Raval",
      "image": "https://i.scdn.co/image/ab6761610000e5ebb26146b5962c243babaa11f0",
      "spotifyId": "2GoeZ0qOTt6kjsWW4eA6LS"
    },
    {
      "name": "Sonu Nigam",
      "image": "https://i.scdn.co/image/ab6761610000e5ebbc959d7569618ec2af2210f5",
      "spotifyId": "1dVygo6tRFXC8CSWURQJq2"
    },
    {
      "name": "Vishal Mishra",
      "image": "https://i.scdn.co/image/ab6761610000e5eb3810f381e2626b80fb3ffb18",
      "spotifyId": "5wJ1H6ud777odtZl5gG507"
    },
    {
      "name": "Pritam",
      "image": "https://i.scdn.co/image/ab6761610000e5ebcb6926f44f620555ba444fca",
      "spotifyId": "1wRPtKGflJrBx9BmLsSwlU"
    },
    {
      "name": "Mohit Chauhan",
      "image": "https://i.scdn.co/image/ab6761610000e5eb16691117e2ba803946b203ba",
      "spotifyId": "5GnnSrwNCGyfAU4zuIytiS"
    }
  ],
  "English": [
    {
      "name": "Taylor Swift",
      "image": "https://i.scdn.co/image/ab6761610000e5eb12184bdd29403de54cb9d9c7",
      "spotifyId": "06HL4z0CvFAxyc27GXpf02"
    },
    {
      "name": "Ed Sheeran",
      "image": "https://i.scdn.co/image/ab6761610000e5ebd55c95ad400aed87da52daec",
      "spotifyId": "6eUKZXaKkcviH0Ku9w2n3V"
    },
    {
      "name": "The Weeknd",
      "image": "https://i.scdn.co/image/ab6761610000e5ebc1719ac9e6a75c1c25835018",
      "spotifyId": "1Xyo4u8uXC1ZmMpatF05PJ"
    },
    {
      "name": "Billie Eilish",
      "image": "https://i.scdn.co/image/ab6761610000e5eb4a21b4760d2ecb7b0dcdc8da",
      "spotifyId": "6qqNVTkY8uBg9cP3Jd7DAH"
    },
    {
      "name": "Drake",
      "image": "https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9",
      "spotifyId": "3TVXtAsR1Inumwj472S9r4"
    },
    {
      "name": "Ariana Grande",
      "image": "https://i.scdn.co/image/ab6761610000e5eb68412f2d0177a9ebc265ff58",
      "spotifyId": "66CXWjxzNUsdJxJ2JdwvnR"
    },
    {
      "name": "Justin Bieber",
      "image": "https://i.scdn.co/image/ab6761610000e5ebaf20f7db5288bce9beede034",
      "spotifyId": "1uNFoZAHBGtllmzznpCI3s"
    },
    {
      "name": "Bruno Mars",
      "image": "https://i.scdn.co/image/ab6761610000e5ebc7688aad1bf03986934d7e26",
      "spotifyId": "0du5cEVh5yTK9QJze8zA0C"
    },
    {
      "name": "Dua Lipa",
      "image": "https://i.scdn.co/image/ab6761610000e5eb0c68f6c95232e716f0abee8d",
      "spotifyId": "6M2wZ9GZgrQXHCFfjv46we"
    },
    {
      "name": "Eminem",
      "image": "https://i.scdn.co/image/ab6761610000e5eba00b11c129b27a88fc72f36b",
      "spotifyId": "7dGJo4pcD2V6oG8kP0tJRR"
    },
    {
      "name": "Post Malone",
      "image": "https://i.scdn.co/image/ab6761610000e5ebe17c0aa1714a03d62b5ce4e0",
      "spotifyId": "246dkjvS1zLTtiykXe5h60"
    },
    {
      "name": "Rihanna",
      "image": "https://i.scdn.co/image/ab6761610000e5ebcb565a8e684e3be458d329ac",
      "spotifyId": "5pKCCKE2ajJHZ9KAiaK11H"
    }
  ],
  "Punjabi": [
    {
      "name": "Diljit Dosanjh",
      "image": "https://i.scdn.co/image/ab6761610000e5ebfc043bea91ac91c222d235c9",
      "spotifyId": "2FKWNmZWDBZR4dE5KX4plR"
    },
    {
      "name": "Karan Aujla",
      "image": "https://i.scdn.co/image/ab6761610000e5eb0b1c8d0651e9c8140af31a61",
      "spotifyId": "6DARBhWbfcS9E4yJzcliqQ"
    },
    {
      "name": "Sidhu Moose Wala",
      "image": "https://i.scdn.co/image/ab6761610000e5eb9973157bdaedef3f77ef8e13",
      "spotifyId": "4PULA4EFzYTrxYvOVlwpiQ"
    },
    {
      "name": "AP Dhillon",
      "image": "https://i.scdn.co/image/ab6761610000e5ebfb505b37709fa86cfd8f55b3",
      "spotifyId": "6LEG9Ld1aLImEFEVHdWNSB"
    },
    {
      "name": "Shubh",
      "image": "https://i.scdn.co/image/ab6761610000e5eb9dfbd284ba8a7d4876a181e3",
      "spotifyId": "5r3wPya2PpeTTsXsGhQU8O"
    },
    {
      "name": "Guru Randhawa",
      "image": "https://i.scdn.co/image/ab6761610000e5eb531f6fb5759f44e7c3d707d6",
      "spotifyId": "5rQoBDKFnd1n6BkdbgVaRL"
    },
    {
      "name": "Ammy Virk",
      "image": "https://i.scdn.co/image/ab6761610000e5eb826f384334f35ca271847e6c",
      "spotifyId": "2RlWC7XKizSOsZ8F3uGi59"
    },
    {
      "name": "B Praak",
      "image": "https://i.scdn.co/image/ab6761610000e5eb0e03d94a7d567c5d4f73d3ed",
      "spotifyId": "56SjZARoEvag3RoKWIb16j"
    },
    {
      "name": "Harrdy Sandhu",
      "image": "https://i.scdn.co/image/ab6761610000e5eb139f693337e94ea1023df8fb",
      "spotifyId": "4ITkqBlf5eoVCOFwsJCnqo"
    },
    {
      "name": "Mankirt Aulakh",
      "image": "https://i.scdn.co/image/ab6761610000e5ebdde55a383dc587b45363f3ff",
      "spotifyId": "3uHUKCspaCzAab9A3LlGAr"
    },
    {
      "name": "Jordan Sandhu",
      "image": "https://i.scdn.co/image/ab6761610000e5eb3c175c74782d935d2588c9cc",
      "spotifyId": "3TozxPbDes76aGFdfv7PMv"
    },
    {
      "name": "Parmish Verma",
      "image": "https://i.scdn.co/image/ab6761610000e5eb2533ca941bf0764c263d7407",
      "spotifyId": "3OQRPFFS3OsltFjFAXu1kE"
    }
  ],
  "Bhojpuri": [
    {
      "name": "Pawan Singh",
      "image": "https://i.scdn.co/image/ab6761610000e5eb337a8e086da8cc3ff50f41a8",
      "spotifyId": "1T7MiVJ2MJlR5GKi11w4VT"
    },
    {
      "name": "Khesari Lal Yadav",
      "image": "https://i.scdn.co/image/ab6761610000e5eb034aea83b2e079e11db4eb53",
      "spotifyId": "69WMBCOrVeaxtZJCowDJ0a"
    },
    {
      "name": "Shilpi Raj",
      "image": "https://i.scdn.co/image/ab6761610000e5eb34b1b490b6090336abbae4af",
      "spotifyId": "12HVwm3qt6gOkKhDoj00m4"
    },
    {
      "name": "MANOJ TIWARI",
      "image": "https://i.scdn.co/image/ab6761610000e5ebc8f646fa5556ab9d2d92c125",
      "spotifyId": "1zERD0GCjQIzwmwAa0wCIJ"
    },
    {
      "name": "Dinesh Lal Yadav Nirahua",
      "image": "https://i.scdn.co/image/ab67616d0000b273eaa16e55ea621b5535c0f297",
      "spotifyId": "7gD0cq6PrOIK3LIbYOb36l"
    },
    {
      "name": "Pramod Premi Yadav",
      "image": "https://i.scdn.co/image/ab6761610000e5eb0bb789e881049efbbb136007",
      "spotifyId": "77mB9wSFg4ED4cY6ndmZWp"
    },
    {
      "name": "Ritesh Pandey",
      "image": "https://i.scdn.co/image/ab6761610000e5eb336a917a27f54e09e4026af0",
      "spotifyId": "65v36mVt3plNHHtR1B7mMX"
    },
    {
      "name": "Arvind Akela Kallu Ji",
      "image": "https://i.scdn.co/image/ab6761610000e5ebf86e6aea18690bef463a7bdf",
      "spotifyId": "6joen1iRSasReFGIlDTkJ8"
    },
    {
      "name": "Samar Singh",
      "image": "https://i.scdn.co/image/ab6761610000e5ebaf38502fa4ead30450f4d54f",
      "spotifyId": "001Ju8fxqMbobN0xjX7XPL"
    },
    {
      "name": "Neelkamal Singh",
      "image": "https://i.scdn.co/image/ab6761610000e5ebf659e690afaf665d7752edf9",
      "spotifyId": "2pywmTkxO0H1CY8ZXSJTSC"
    },
    {
      "name": "Akshara Singh",
      "image": "https://i.scdn.co/image/ab6761610000e5ebdde618b9e81cef61abffa601",
      "spotifyId": "1fqyrzsbNUJyi7nj5K0x4C"
    },
    {
      "name": "Priyanka Singh",
      "image": "https://i.scdn.co/image/ab6761610000e5eb4c30cdcf3000d260b2858207",
      "spotifyId": "6a5KdTA4zpapsLLfyiNk0M"
    }
  ],
  "Haryanvi": [
    {
      "name": "Sapna Choudhary",
      "image": "https://i.scdn.co/image/ab6761610000e5eb9f5e807f763558cb4b688085",
      "spotifyId": "5WYVZzKOZMUn4pNY9gy2BM"
    },
    {
      "name": "Gulzaar Chhaniwala",
      "image": "https://i.scdn.co/image/ab6761610000e5eb92c9009d42e5dd670f346337",
      "spotifyId": "1LOB46pDsJhtIXW1nbHYZo"
    },
    {
      "name": "Renuka Panwar",
      "image": "https://i.scdn.co/image/ab6761610000e5ebde64c573de4cdccfc2d4c821",
      "spotifyId": "2wDTo0nO2ZKJN7VUeGmuyg"
    },
    {
      "name": "Diler Kharkiya",
      "image": "https://i.scdn.co/image/ab6761610000e5ebb0ce84511eda37bab4d6f3e8",
      "spotifyId": "5d6sKB0JbbWKiWoPDTLPj0"
    },
    {
      "name": "Masoom Sharma",
      "image": "https://i.scdn.co/image/ab6761610000e5eb2cf6d06726cbbf929c6d37d8",
      "spotifyId": "36iDrP3UnCxsSH9LuSdkDj"
    },
    {
      "name": "Ajay Hooda",
      "image": "https://i.scdn.co/image/ab6761610000e5eb41abc09eaee6f7b46a986b12",
      "spotifyId": "0chXoaSRKjUrHfFPzdcmSc"
    },
    {
      "name": "Raju Punjabi",
      "image": "https://i.scdn.co/image/ab6761610000e5ebba9de88e543fcc49e18e9b83",
      "spotifyId": "5RnjdaS0Pqb4KgWvCoohs8"
    },
    {
      "name": "Amit Saini Rohtakiya",
      "image": "https://i.scdn.co/image/ab6761610000e5eb9a30ae69d1a2b368cdb4c8db",
      "spotifyId": "4d8PlD50b5CG0eIBY6jm0b"
    },
    {
      "name": "Sumit Goswami",
      "image": "https://i.scdn.co/image/ab6761610000e5eb81205cdb668302bca77493f8",
      "spotifyId": "7h79JnwJEjrnCCyGrxTdZM"
    },
    {
      "name": "KD DESIROCK",
      "image": "https://i.scdn.co/image/ab6761610000e5eb481b955724dd8f7518084e9c",
      "spotifyId": "4Pq2LW79qotJK4YAMFwlO0"
    },
    {
      "name": "Ruchika Jangid",
      "image": "https://i.scdn.co/image/ab6761610000e5eb6266063e70b9203714766688",
      "spotifyId": "5NgijFuMvkarmVkTpCnwjE"
    },
    {
      "name": "Khasa Aala Chahar",
      "image": "https://i.scdn.co/image/ab6761610000e5ebc75ed9d890bbc84b7c06e182",
      "spotifyId": "3yOHCFUZRsaHUu1yefR8ck"
    }
  ],
  "Bengali": [
    {
      "name": "Arijit Singh",
      "image": "https://i.scdn.co/image/ab6761610000e5ebadfb0b2df04b77e43b5f7375",
      "spotifyId": "4YRxDV8wJFPHPTeXepOstw"
    },
    {
      "name": "Shreya Ghoshal",
      "image": "https://i.scdn.co/image/ab6761610000e5ebe7ce89a9f5d11e0ba26677eb",
      "spotifyId": "0oOet2f43PA68X5RxKobEy"
    },
    {
      "name": "Anupam Roy",
      "image": "https://i.scdn.co/image/ab6761610000e5eb4eb9637ea26549aca494a011",
      "spotifyId": "5LZ894xYE9MG1sal0gjt5L"
    },
    {
      "name": "Rupam Islam",
      "image": "https://i.scdn.co/image/ab6761610000e5eb67e05847ab994b5fad7d6fbc",
      "spotifyId": "1pRruDTNcEFpBPvpFZU76o"
    },
    {
      "name": "Somlata Acharyya Chowdhury",
      "image": "https://i.scdn.co/image/ab6761610000e5eb20dbfb5238ec2bbb9846d6e4",
      "spotifyId": "43t7ABAwiLwVJ9b738CWOh"
    },
    {
      "name": "Iman Chakraborty",
      "image": "https://i.scdn.co/image/ab6761610000e5eb2295af138b42f36979a5e4f2",
      "spotifyId": "7gjiYwM6O5sNuYBaCdpCXA"
    },
    {
      "name": "Nachiketa Chakraborty",
      "image": "https://i.scdn.co/image/ab6761610000e5eb6e53d298723521e0d130afa7",
      "spotifyId": "77MQhYJ01hRivFGS5hXjTY"
    },
    {
      "name": "Shaan",
      "image": "https://i.scdn.co/image/ab6761610000e5eb2573d940f1062a6646891e50",
      "spotifyId": "5cB4d4jPYjMT326sjihQ4m"
    },
    {
      "name": "Kumar Sanu",
      "image": "https://i.scdn.co/image/ab6761610000e5ebc7d2a4212ee745b2c72298e0",
      "spotifyId": "4K6blSRoklNdpw4mzLxwfn"
    },
    {
      "name": "Monali Thakur",
      "image": "https://i.scdn.co/image/ab6761610000e5eb11b74da61ac68765f883e03f",
      "spotifyId": "2o4R2rK7FetH40HTv0SUWl"
    },
    {
      "name": "Jeet Gannguli",
      "image": "https://i.scdn.co/image/ab6761610000e5eb6adc98db259e563ee2352b85",
      "spotifyId": "2kkQthS9OLpK4UqNWYqoVl"
    },
    {
      "name": "Kishore Kumar",
      "image": "https://i.scdn.co/image/ab6761610000e5ebc9ac92d87de28795c1c49730",
      "spotifyId": "0GF4shudTAFv8ak9eWdd4Y"
    }
  ],
  "Tamil": [
    {
      "name": "Anirudh Ravichander",
      "image": "https://i.scdn.co/image/ab6761610000e5eb0f0be2054fe9594026a6b843",
      "spotifyId": "4zCH9qm4R2DADamUHMCa6O"
    },
    {
      "name": "A.R. Rahman",
      "image": "https://i.scdn.co/image/ab6761610000e5ebb19af0ea736c6228d6eb539c",
      "spotifyId": "1mYsTxnqsietFxj1OgoGbG"
    },
    {
      "name": "Sid Sriram",
      "image": "https://i.scdn.co/image/ab6761610000e5ebef6a8800763bf428e85940a6",
      "spotifyId": "7qjJw7ZM2ekDSahLXPjIlN"
    },
    {
      "name": "Yuvan Shankar Raja",
      "image": "https://i.scdn.co/image/ab6761610000e5ebe60d7a790ebea50d205bda93",
      "spotifyId": "6AiX12wXdXFoGJ2vk8zBjy"
    },
    {
      "name": "Harris Jayaraj",
      "image": "https://i.scdn.co/image/ab6761610000e5eb1263a7722e01be16b21ab944",
      "spotifyId": "29aw5YCdIw2FEXYyAJZI8l"
    },
    {
      "name": "Santhosh Narayanan",
      "image": "https://i.scdn.co/image/ab6761610000e5eba52538772891f66547e1ebc3",
      "spotifyId": "5FVBduYaeVBb6JIghza7v6"
    },
    {
      "name": "D. Imman",
      "image": "https://i.scdn.co/image/ab6761610000e5eb859ef7414772b7d07526d40a",
      "spotifyId": "1QcBqYUeQ4Ux3itkdDaFi0"
    },
    {
      "name": "S. P. Balasubrahmanyam",
      "image": "https://i.scdn.co/image/ab6761610000e5ebea2b56271cf92bcff45c0ae9",
      "spotifyId": "2ae6PxICSOZHvjqiCcgon8"
    },
    {
      "name": "K. S. Chithra",
      "image": "https://i.scdn.co/image/ab6761610000e5eb27852ef557c522e357664824",
      "spotifyId": "2IUtwMti1OiT3lkW6RubgH"
    },
    {
      "name": "Shreya Ghoshal",
      "image": "https://i.scdn.co/image/ab6761610000e5ebe7ce89a9f5d11e0ba26677eb",
      "spotifyId": "0oOet2f43PA68X5RxKobEy"
    },
    {
      "name": "Dhanush",
      "image": "https://i.scdn.co/image/ab6761610000e5eb4624051fef26f472c786d7c0",
      "spotifyId": "2F3KtUVtrt2GLjcl6pB4cz"
    },
    {
      "name": "Pradeep Kumar",
      "image": "https://i.scdn.co/image/ab6761610000e5eb8bad2f4b1b3159d8c3d29f45",
      "spotifyId": "15ClyGUe5g2vllncIC4tp6"
    }
  ]
};

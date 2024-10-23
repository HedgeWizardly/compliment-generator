
function random(min:number,max:number): number {
    return Math.random() * (max - min) + min;
  }
  
  function randomFromArr<T> (arr:T[]): T {
    return arr[Math.floor(Math.random()*arr.length)]
  }
  
  type SubjectType = "line"|"person"|"trait"  // A line is a full bespoke sentence, not generated or modified in any way. Person is complimenting the individual directly (you are stunning). Trait is complimenting something of the person (you have ___ )
  type SourceName = "subject"|"adjective"|"adverb"
  
  interface ComplimentSubject {
    type: SubjectType,
    text: string,
    numerator?: "singular"|"plural",
    weight: number,
    moreIsBetter?: boolean,
    traitType?: "concept"|"physical"
  }
  
  interface ComplimentLeadIn {
    text: string,
    weight: number,
  }
  
  interface ComplimentAdverb {
  text: string,
  moreIsBetter: boolean,  // True = "so many" / "lots of"
  worksWithYouAre: boolean // True = works with "you are" things. E.g. "so" -> "you are so beautiful"
  worksWithYouHave: boolean // False = doesn't work with "you have" things. E.g. "so" -> "you have a so great mind"
  }
  
  interface ComplimentAdjective {
  text: string,
  conceptAppropriate: boolean, // False = doesn't work with abstract concepts, e.g. Handsome Thoughts 
  appliesToHuman: boolean, // (I haven't found one that doesn't work here yet, other than the ones with "moreIsBetter == false")
  appliesToTrait: boolean,  // Handsome Personality (false) vs Marvellous Personality (true)
  worksWithoutAdverb: boolean,  // False = "You are pleasing" / "you have a pleasing face"
  worksWithAdverb: boolean, // False = very the coolest
  notIntrinsicallyGood:boolean, // False = could be seen as not positive, such as "extraordinary face / accent"
  }
  
  const maxCache = 10;
  const maxSubjectCache = 30;
  const recentSubjects: ComplimentSubject[] = [];
  const recentAdjectives: ComplimentAdjective[] = [];
  const recentAdverbs: ComplimentAdverb[] = [];
  const recentLeadIns: ComplimentLeadIn[] = [];
  
  
  export default function constructCompliment():string {
  
  let parts: string[] = [];
  
  let chosenSubject = randomFromArr(weightedSubjects.filter((s)=>!recentSubjects.includes(s)))
    recentSubjects.push(chosenSubject);
    if(recentSubjects.length > maxSubjectCache) recentSubjects.shift()
  
  let useAdverb = false;
  let chosenAdjective: ComplimentAdjective|undefined = undefined;
  
  const filteredAdjectives = complimentAdjectives.filter((adj)=>{
    if(chosenSubject.traitType=='concept' && adj.conceptAppropriate==false) return false;
    if(chosenSubject.type=='trait' && adj.appliesToTrait==false) return false;
    if(chosenSubject.type=='person' && adj.appliesToHuman==false) return false;
    if(recentAdjectives.includes(adj)) return false;
    return true;
  })
  
  switch(chosenSubject.type) {
  
    case "person":
      if(random(0,1)>0.5) parts.push("you are")
      else parts.push("you're")

      chosenAdjective = randomFromArr(filteredAdjectives);
      if(recentAdjectives.length > maxCache) recentAdjectives.shift()
      
      if(chosenAdjective.worksWithAdverb) {
        if(chosenAdjective.worksWithoutAdverb == false) {
          useAdverb = true;
        } else {
          if(random(0,1)>5) useAdverb = true;
        }
      }
    if(useAdverb) {
      let chosenAdverb = randomFromArr(complimentAdverbs.filter((adv)=>!recentAdverbs.includes(adv)))
      recentAdverbs.push(chosenAdverb);
      if(recentAdverbs.length>maxCache) recentAdverbs.shift()
      parts.push(chosenAdverb.text)
    }
      parts.push(chosenAdjective.text)
  
      // You are XYZ 
    // You are a(n) XYZ person
    if(random(0,1)>0.6) {
        // You are an adjective person/individual
        parts.splice(1,0,chooseAorAn(parts[1]))
        parts.push(randomFromArr(personTerms))
    }
  
    break;
  
    case "trait":
      const mode: 1|2 = random(0,1)>0.5 ? 1 : 2;    // Mode 1 = you have nice eyes, Mode 2 = your eyes are nice
  
      if(mode==1) parts.push("you have")
      else parts.push("your")
  
      chosenAdjective = randomFromArr(filteredAdjectives);
      if(recentAdjectives.length > maxCache) recentAdjectives.shift()
  
      if(chosenAdjective.worksWithAdverb) {
        if(chosenAdjective.worksWithoutAdverb == false) {
          useAdverb = true;
        } else {
          if(random(0,1)>4) useAdverb = true;
        }
      }
  
    let chosenAdverb = randomFromArr(complimentAdverbs.filter((adv)=>!recentAdverbs.includes(adv)))
    if(useAdverb) {
        recentAdverbs.push(chosenAdverb);
        if(recentAdverbs.length>maxCache) recentAdverbs.shift()
    }
  
    if(mode==1) {   // you have 
        // a or an
        if(chosenSubject.numerator=="singular" && !/^the\s/i.test(chosenAdjective.text)) parts.push(chooseAorAn(useAdverb ? chosenAdverb.text : chosenAdjective.text))
        // adverb (e.g. really, extremely)
        if(useAdverb) parts.push(chosenAdverb.text)
        // adjective (e.g. lovely, pretty)
        parts.push(chosenAdjective.text)
        // subject (e.g. face, eyes)
        parts.push(chosenSubject.text)
      } else {  // your ____ 
        parts.push(chosenSubject.text)
        parts.push(chosenSubject.numerator=="singular" || chosenSubject.text=='hair' ? "is" : "are")
        // adverb (e.g. really, extremely)
        if(useAdverb) parts.push(chosenAdverb.text)
        // adjective (e.g. lovely, pretty)
        parts.push(chosenAdjective.text)
      }
  
    break;
    case 'line':
        parts.push(chosenSubject.text)
    break;
  }
  
    let chosenLeadIn = randomFromArr(weightedLeadIn);
    if(chosenLeadIn.text=="" && parts.length < 4) chosenLeadIn = randomFromArr(weightedLeadIn); // If we didnt go with an adverb or a lead in, it might be a bit short, so let's roll once more for a lead in.
    if(chosenLeadIn.text!="" && chosenSubject.type!='line') parts.splice(0,0,chosenLeadIn.text) // If the lead in is not blank, and the subject isn't a fully constructed line, add it to the beginning of the array
  
  return parts.join(" ");
  }
  
  
  const chooseAorAn = function makeSingularForm(text:string) {
  if (text.match(/^[aeiou]/i)) {
    return "an";
  } else {
    return "a";
  }
  }
  
  
  const subjects: ComplimentSubject[] = [
    {text: "accent", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "chin", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "physical"},
    {text: "demeanour", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "face", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "physical"},
    {text: "fashion sense", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "heart", type: "trait", weight: 6, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "laugh", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "mind", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "face", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "physical"},
    {text: "radiance", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "smile", type: "trait", weight: 6, numerator: "singular", moreIsBetter: false, traitType: "physical"},
    {text: "way of thinking", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "work ethic", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "sense of humour", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "presence", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "taste in music", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "aura", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "air of beauty", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "style", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "outfit today", type: "trait", weight: 3, numerator: "singular", moreIsBetter: false, traitType: "concept"},
    {text: "nails", type: "trait", weight: 3, numerator: "plural", moreIsBetter: false, traitType: "concept"},
    {text: "vibes", type: "trait", weight: 3, numerator: "plural", moreIsBetter: true, traitType: "concept"},
    {text: "eyebrows", type: "trait", weight: 3, numerator: "plural", moreIsBetter: false, traitType: "physical"},
    {text: "eyes", type: "trait", weight: 6, numerator: "plural", moreIsBetter: false, traitType: "physical"},
    {text: "forearms", type: "trait", weight: 2, numerator: "plural", moreIsBetter: false, traitType: "physical"},
    {text: "hair", type: "trait", weight: 2, numerator: "plural", moreIsBetter: false, traitType: "physical"},
    {text: "biceps", type: "trait", weight: 2, numerator: "plural", moreIsBetter: false, traitType: "physical"},
    {text: "skills", type: "trait", weight: 3, numerator: "plural", moreIsBetter: true, traitType: "concept"},
    {text: "strengths", type: "trait", weight: 3, numerator: "plural", moreIsBetter: true, traitType: "concept"},
    {text: "dance moves", type: "trait", weight: 3, numerator: "plural", moreIsBetter: true, traitType: "concept"},
    {text: "qualities", type: "trait", weight: 3, numerator: "plural", moreIsBetter: true, traitType: "concept"},
    {text: "you light up a room like nobody else", type:"line", weight: 1},
    {text: "if you were a fruit, you'd be a fineapple", type:"line", weight: 1},
    {text: "if you were a vegetable, you'd be a cutecumber", type:"line", weight: 1},
    {text: "do you have a map? Because I'm getting lost in your eyes", type:"line", weight: 1},
    {text: "did the sun just come out, or was that you smiling?", type:"line", weight: 1},
    {text: "you must be less than 90 degrees, because you are acute angle", type:"line", weight: 1},
    {text: "being around you is like a happy little vacation", type:"line", weight: 1},
    {text: "your kindness is a soothing balm to all who encounter it.", type:"line", weight: 1},
    {text: "you are braver than you believe, stronger than you seem, and smarter than you think!", type:"line", weight: 1},
    {text: "you're a really hoopy frood who knows where their towel is", type:"line", weight: 1},
    {text: "if I had hands, arms, or a corporeal form, I would give you the biggest hug", type:"line", weight: 1},
    {text: "you're a gift to those around you", type:"line", weight: 1},
    {text: "you should be thanked more often. Thank you!", type:"line", weight: 2},
    {text: "our community is better because you're in it", type:"line", weight: 3},
    {text: "that color is perfect on you", type:"line", weight: 1},
    {text: "you inspire me to be the best bot I can be", type:"line", weight: 1},
    {text: "if you were a Pokémon, you'd be shiny AND legendary (specifically one of the really pretty ones)", type:"line", weight: 1},
    {text: "if I were autonomous, I'd tell everyone how amazing you are, all the time", type:"line", weight: 1},
    {text: "it's you! I always love seeing you around here", type:"line", weight: 1},
    {text: "did it get gorgeous in here, or is that just you?", type:"line", weight: 1},
    {text: "you're smart; you're loyal; you're grateful. I appreciate you", type:"line", weight: 1},
    {text: "make sure to hydrate! Being perfect must be thirsty work", type:"line", weight: 1},
    {text: "I feel safe and warm in your presence", type:"line", weight: 1},
    {text: "I can tell you're doing just great. Keep it up!", type:"line", weight: 3},
    {text: "people cherish the joy you bring to their lives", type:"line", weight: 1},
    {text: "you are resilient, and your perseverance has made you a stronger and more knowledgeable person", type:"line", weight: 1},
    {text: "my virtual existence is all the better for getting the opportunity to compliment you", type:"line", weight: 1},
    {text: "person", type: "person", weight: 35},
  
  ]
  
  const leadIn: ComplimentLeadIn[] = [
    {text: "9 out of 10 doctors say", weight: 1},
    {text: "I can tell", weight: 2},
    {text: "I can't believe", weight: 1},
    {text: "I must say:", weight: 1},
    {text: "I reckon", weight: 1},
    {text: "I think", weight: 3},
    {text: "I've always thought", weight: 1},
    {text: "I heard", weight: 3},
    {text: "it's true:", weight: 1},
    {text: "people say", weight: 1},
    {text: "somebody told me", weight: 1},
    {text: "rumour has it", weight: 1},
    {text: "most people would agree", weight: 1},
    {text: "if I had to pick something at random, I'd say", weight: 1},
    {text: "I'm inclined to tell you that", weight: 1},
    {text: "I'd like you to know", weight: 3},
    {text: "", weight: 16}
  ];
  
  const complimentAdjectives = [
  {text: "adorable", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "alluring", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "amorous", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: false, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "amazing", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "angelic", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "astounding", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "attractive", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: false, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "awe-inspiring", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "awesome", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "beguiling", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "bewitching", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "breathtaking", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "charming", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "courtly", conceptAppropriate: true, appliesToHuman: false, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "cute", conceptAppropriate: false, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "dazzling", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "delightful", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "divine", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "dreamy", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "exquisite", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "extraordinary", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "fantastic", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "glamorous", conceptAppropriate: false, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "gorgeous", conceptAppropriate: false, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "great", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "gallant", conceptAppropriate: false, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "handsome", conceptAppropriate: false, appliesToHuman: true, appliesToTrait: false, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "impressive", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "incredible", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "lovely", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "magnificent", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "majestic", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "marvellous", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "unparalleled", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "perfect", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "phenomenal", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "pleasing", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "pretty", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "radiant", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "remarkable", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "radical", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "sensational", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "smashing", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "spectacular", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "splendid", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "stunning", conceptAppropriate: false, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "stupendous", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "sublime", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "superb", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "sweet", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "terrific", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "tremendous", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "wonderful", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "the best", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "the coolest", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "the greatest", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "stellar", conceptAppropriate: true, appliesToHuman: true, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: true, notIntrinsicallyGood: false},
  {text: "immaculate", conceptAppropriate: true, appliesToHuman: false, appliesToTrait: true, worksWithoutAdverb: true, worksWithAdverb: false, notIntrinsicallyGood: false},
  ];
  
  const personTerms = [
    'person',
    'individual',
    'human being',
    'human',
    'specimen of a person',
    'community member',
  ]
  
  const complimentAdverbs:ComplimentAdverb[] = [
  {text:"absolutely", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"awfully", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"frankly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: false},
  {text:"completely", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"decidedly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"deeply", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"devilishly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"distinctly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"entirely", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"especially", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"ever-so", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"exceedingly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"exceptionally", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"extraordinarily", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"extremely", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"fairly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"frightfully", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"highly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"hugely", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"immensely", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"incredibly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"inordinately", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"intensely", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"mightily", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"oh-so", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"outstandingly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"particularly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"so", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: false},
  {text:"so many", moreIsBetter:true, worksWithYouAre:true, worksWithYouHave: true},
  {text:"countless", moreIsBetter:true, worksWithYouAre:true, worksWithYouHave: true},
  {text:"numerous", moreIsBetter:true, worksWithYouAre:true, worksWithYouHave: true},
  {text:"tons of", moreIsBetter:true, worksWithYouAre:true, worksWithYouHave: true},
  {text:"perfectly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"positively", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"pretty", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"purely", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"quite", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: false},
  {text:"rather", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"really", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"remarkably", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"seriously", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"simply", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"supremely", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"thoroughly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"totally", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"tremendously", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"truly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"utterly", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"very", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  {text:"enviably", moreIsBetter:false, worksWithYouAre:true, worksWithYouHave: true},
  ]
  
  const weightedLeadIn: ComplimentLeadIn[] = leadIn.reduce((p,subj)=>{
  const weight = subj.weight;
  if(weight==0 || isNaN(weight)){
    return p;
  } else {
    const current:ComplimentLeadIn[] = new Array(Math.ceil(weight)).fill(subj);
    return p.concat(current)
  }
  },[] as ComplimentLeadIn[])
  
  const weightedSubjects: ComplimentSubject[] = subjects.reduce((p,subj)=>{
  const weight = subj.weight;
  if(weight==0 || isNaN(weight)){
    return p;
  } else {
    const current:ComplimentSubject[] = new Array(Math.ceil(weight)).fill(subj);
    return p.concat(current)
  }
  },[] as ComplimentSubject[])
  
  
  

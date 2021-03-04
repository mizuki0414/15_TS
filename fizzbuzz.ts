type Maybe<T> = T | "";

type Fizz = "Fizz";
type Buzz = "Buzz";
type FizzBuzz = Fizz | Buzz | "FizzBuzz";
type Result = FizzBuzz | string;

type FB<T extends Fizz | Buzz> = (p: number) => Maybe<T>;

type Main = (p: number) => string;
type Game = (p: undefined, p2: number) => Result;

type IsFizzBuzz = (p: string) => boolean;

 const fizz: FB<Fizz> = p => (p % 3 == 0 ? "Fizz" : "");
 const buzz: FB<Buzz> = p => (p % 5 == 0 ? "Buzz" : "");

const game: Game = (_, i) => {
    const k = i + 1;
    const r =  [fizz(k), buzz(k)].join("");
    return isFizzBuzz(r) ? r : k.toString();
}

const main: Main = p => [...Array(p)].map(game).join(", ");

const suitableValue = 16;
alert(main(suitableValue));
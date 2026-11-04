export type Kana = { id: string; character: string; answers: string[]; group: string };
const rows = [
  ['a', 'あいうえお', 'a i u e o'], ['ka', 'かきくけこ', 'ka ki ku ke ko'],
  ['sa', 'さしすせそ', 'sa shi/si su se so'], ['ta', 'たちつてと', 'ta chi/ti tsu/tu te to'],
  ['na', 'なにぬねの', 'na ni nu ne no'], ['ha', 'はひふへほ', 'ha hi fu/hu he ho'],
  ['ma', 'まみむめも', 'ma mi mu me mo'], ['ya', 'やゆよ', 'ya yu yo'],
  ['ra', 'らりるれろ', 'ra ri ru re ro'], ['wa', 'わをん', 'wa wo n/nn'],
  ['ga', 'がぎぐげご', 'ga gi gu ge go'], ['za', 'ざじずぜぞ', 'za ji/zi zu ze zo'],
  ['da', 'だぢづでど', 'da ji/di zu/du de do'], ['ba', 'ばびぶべぼ', 'ba bi bu be bo'],
  ['pa', 'ぱぴぷぺぽ', 'pa pi pu pe po'],
];
export const groups = rows.map(([id, characters, answers]) => ({ id, characters: [...characters], answers: answers.split(' ') }));
export function getKana(script: 'hiragana' | 'katakana', composite: boolean): Kana[] {
  const convert = (value: string) => script === 'hiragana' ? value : [...value].map(character => String.fromCharCode(character.charCodeAt(0) + 0x60)).join('');
  if (composite) {
    return [['k', 'き'], ['sh', 'し'], ['ch', 'ち'], ['n', 'に'], ['h', 'ひ'], ['m', 'み'], ['r', 'り'], ['g', 'ぎ'], ['j', 'じ'], ['b', 'び'], ['p', 'ぴ']].flatMap(([prefix, character]) => ['a', 'u', 'o'].map((vowel, index) => {
      const answer = `${prefix}${['sh', 'ch', 'j'].includes(prefix) ? '' : 'y'}${vowel}`;
      return { id: `${script}-${answer}`, character: convert(character + ['ゃ', 'ゅ', 'ょ'][index]), answers: [answer], group: prefix };
    }));
  }
  return groups.flatMap(group => group.characters.map((character, index) => ({ id: `${script}-${character}`, character: convert(character), answers: group.answers[index].split('/'), group: group.id })));
}

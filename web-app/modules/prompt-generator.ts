import { Readable } from 'stream';

export class PromptGenerator {
    promptVersion: string;

    constructor() {
        this.promptVersion = '1.0';
    }

    legalAuditForward(word: string) {
        const modelConf = {
            model: '3.5',
            temperature: 0
        };
        const generatePrompts = (word: string) => {
            return [{ prompt: word }];
        };
        const parseResponse = (messageItem: any) => {
            return { isLegal: true, reason: '' };
        };
        return { modelConf, generatePrompts, parseResponse };
    }

    getRelatedWords(userText: string) {
        const modelConf = {
            model: '3.5',
            temperature: 0
        };
        const generatePrompts = (userText: string) => {
            return [{ prompt: userText }];
        };
        const parseResponse = (messageItem: any) => {
            return { relatedWords: [] };
        };
        return { modelConf, generatePrompts, parseResponse };
    }

    createWordDoc(originWord: string) {
        const modelConf = {
            model: '4',
            temperature: 0.2
        };
        const generatePrompts = (originWord: string) => {
            return [{ prompt: originWord }];
        };
        const parseResponse = (messageItem: any) => {
            return { wordDoc: '' };
        };
        return { modelConf, generatePrompts, parseResponse };
    }

    generateChatTitle(historicalMessageList: any[]) {
        const modelConf = {
            model: '4',
            temperature: 0.2
        };
        const generatePrompts = (historicalMessageList: any[]) => {
            return [{ prompt: historicalMessageList.join(' ') }];
        };
        const parseResponse = (messageItem: any) => {
            return { title: '' };
        };
        return { modelConf, generatePrompts, parseResponse };
    }

    legalAuditForWordQuestion(historicalQuestion: string) {
        const modelConf = {
            model: '4.3',
            temperature: 0
        };
        const generatePrompts = (historicalQuestion: string) => {
            return [{ prompt: historicalQuestion }];
        };
        const parseResponse = (messageItem: any) => {
            return { isLegal: true, reason: '' };
        };
        return { modelConf, generatePrompts, parseResponse };
    }

    appendAMessageToWordDialogue(historicalQuestion: string) {
        const modelConf = {
            model: '4',
            temperature: 0.2
        };
        const generatePrompts = (historicalQuestion: string) => {
            return [{ prompt: historicalQuestion }];
        };
        const parseResponse = (messageItem: any) => {
            return { message: '' };
        };
        return { modelConf, generatePrompts, parseResponse };
    }

    createWordQuestionDialogue({ originWord, wordDoc }: { originWord: string, wordDoc: string }) {
        const modelConf = {
            model: '4',
            temperature: 0.2
        };
        const generatePrompts = ({ originWord, wordDoc }: { originWord: string, wordDoc: string }) => {
            return [{ prompt: originWord + ' ' + wordDoc }];
        };
        const parseResponse = (messageItem: any) => {
            return { message: '' };
        };
        return { modelConf, generatePrompts, parseResponse };
    }
}
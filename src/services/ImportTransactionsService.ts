import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';

import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';

import CreateTransactionService from './CreateTransactionService';

interface TransactionLine {
  title: string;
  type: 'income' | 'outcome';
  category: string;
  value: number;
}

interface Request {
  filename: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const importFilePath = path.join(uploadConfig.directory, filename);
    const readImportFileStream = fs.createReadStream(importFilePath);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const lines: TransactionLine[] = [];

    const parseCSV = readImportFileStream.pipe(parseStream);
    parseCSV.on('data', line => {
      const transaction: TransactionLine = {
        title: line[0],
        type: line[1],
        value: line[2],
        category: line[3],
      };
      lines.push(transaction);
    });
    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const transactionService = new CreateTransactionService();

    const transactions = lines.reduce(
      async (acumulador: Promise<Transaction[]>, data: TransactionLine) => {
        const current = await acumulador;
        const transaction = await transactionService.execute(data);

        if (transaction) {
          current.push(transaction);
        }

        return Promise.resolve(current);
      },
      Promise.resolve([]),
    );

    const userAvatarFileExists = await fs.promises.stat(importFilePath);
    if (userAvatarFileExists) {
      await fs.promises.unlink(importFilePath);
    }

    return transactions;
  }
}

export default ImportTransactionsService;

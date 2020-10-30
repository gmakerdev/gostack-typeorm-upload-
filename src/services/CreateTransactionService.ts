import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';

import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction | null> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionRepository);

    let findCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (type === 'outcome') {
      const { income, outcome } = await transactionRepository.getBalance();

      const diferenca = income - outcome;

      if (value > diferenca) {
        throw new AppError('Outcome não pode ser maior que Income', 400);
      }
    }

    if (!findCategory) {
      findCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(findCategory);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: findCategory.id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;

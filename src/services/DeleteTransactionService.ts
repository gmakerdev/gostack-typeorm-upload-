import { getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const repository = getRepository(Transaction);
    const findTransaction = await repository.findOne(id);
    if (!findTransaction) {
      throw new AppError('Transaction not found', 400);
    }
    await repository.delete(id);
  }
}

export default DeleteTransactionService;

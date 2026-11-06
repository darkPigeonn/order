import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Sequence } from "./schemas/sequence.schema";

@Injectable()
export class SequenceService {
  constructor(@InjectModel(Sequence.name) private readonly sequenceModel: Model<Sequence>) {}

  async next(key: string): Promise<number> {
    const row = await this.sequenceModel.findOneAndUpdate(
      { key },
      { $inc: { value: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return row.value;
  }
}
